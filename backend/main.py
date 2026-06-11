from __future__ import annotations

import asyncio
import hashlib
import json
import os
import sqlite3
import time
import secrets
from contextvars import ContextVar
from contextlib import asynccontextmanager, contextmanager, suppress
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import requests

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


DB_PATH = Path(os.getenv("GUJING_DB_PATH", Path(__file__).with_name("gujing.db")))
DEFAULT_USER_ID = "default_user"
DEFAULT_USER_PROFILE = {
    "id": DEFAULT_USER_ID,
    "displayName": "Alex-w",
    "riskLevel": "稳健",
    "defaultMarket": "A股",
}
ADVICE_MODEL_VERSION = "advice-v2-personalized"
FORECAST_MODEL_VERSION = "forecast-v1-rule-stat"
RECOMMENDATION_MODEL_VERSION = "recommend-v2-feedback"
RISK_PROFILE_RULES = {
    "稳健": {
        "label": "稳健",
        "scoreOffset": -4,
        "positionLimit": 18,
        "heavyPosition": 28,
        "maxTarget": "8%-18%",
        "normalTarget": "8%-15%",
        "tone": "优先控制回撤，宁愿少赚也不要承受过大波动。",
    },
    "均衡": {
        "label": "均衡",
        "scoreOffset": 0,
        "positionLimit": 25,
        "heavyPosition": 35,
        "maxTarget": "10%-25%",
        "normalTarget": "10%-20%",
        "tone": "在控制仓位的前提下，允许适度跟踪趋势机会。",
    },
    "进取": {
        "label": "进取",
        "scoreOffset": 4,
        "positionLimit": 32,
        "heavyPosition": 45,
        "maxTarget": "15%-35%",
        "normalTarget": "12%-28%",
        "tone": "可以承受更高波动，但仍需要避免单只股票过度集中。",
    },
}
COMPLIANCE_DISCLOSURE = {
    "title": "研究辅助说明",
    "shortText": "本工具只做信息整理、概率观察和风险提示，不构成证券投资建议。",
    "items": [
        "模型输出不代表收益承诺，也不直接构成买卖指令。",
        "行情、K线、新闻和市值字段可能存在延迟、缺失或来源差异。",
        "用户应结合自身风险承受能力，并通过正规持牌机构完成交易决策。",
    ],
}
INDUSTRY_MODEL_RULES = {
    "银行": {
        "name": "金融防御模型",
        "focus": "更重视估值安全、波动控制和分红稳定性。",
        "weights": {"trend": 0.2, "volatility": 0.18, "data": 0.16, "news": 0.1, "forecast": 0.12},
    },
    "白酒": {
        "name": "消费质量模型",
        "focus": "更重视经营质量、估值敏感度和需求修复。",
        "weights": {"trend": 0.23, "volatility": 0.14, "data": 0.16, "news": 0.12, "forecast": 0.13},
    },
    "动力电池": {
        "name": "成长波动模型",
        "focus": "更重视趋势动量、行业景气和波动风险。",
        "weights": {"trend": 0.28, "volatility": 0.18, "data": 0.1, "news": 0.12, "forecast": 0.16},
    },
    "default": {
        "name": "通用稳健模型",
        "focus": "综合趋势、波动、数据完整度和消息面。",
        "weights": {"trend": 0.24, "volatility": 0.16, "data": 0.12, "news": 0.12, "forecast": 0.14},
    },
}
CURRENT_USER_ID: ContextVar[str] = ContextVar("current_user_id", default=DEFAULT_USER_ID)
AUTH_TOKEN_EXPIRE_DAYS = 30
AUTH_REFRESH_WINDOW_DAYS = 7
SMS_CODE_EXPIRE_MINUTES = 5
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "mock").lower()
SMS_PROVIDER_CONFIG = {
    "mock": {
        "name": "开发模拟短信",
        "ready": True,
        "env": [],
    },
    "aliyun": {
        "name": "阿里云短信",
        "ready": all(
            os.getenv(key)
            for key in ("ALIYUN_SMS_ACCESS_KEY_ID", "ALIYUN_SMS_ACCESS_KEY_SECRET", "ALIYUN_SMS_SIGN_NAME", "ALIYUN_SMS_TEMPLATE_CODE")
        ),
        "env": ["ALIYUN_SMS_ACCESS_KEY_ID", "ALIYUN_SMS_ACCESS_KEY_SECRET", "ALIYUN_SMS_SIGN_NAME", "ALIYUN_SMS_TEMPLATE_CODE"],
    },
    "tencent": {
        "name": "腾讯云短信",
        "ready": all(
            os.getenv(key)
            for key in ("TENCENT_SMS_SECRET_ID", "TENCENT_SMS_SECRET_KEY", "TENCENT_SMS_SDK_APP_ID", "TENCENT_SMS_SIGN_NAME", "TENCENT_SMS_TEMPLATE_ID")
        ),
        "env": ["TENCENT_SMS_SECRET_ID", "TENCENT_SMS_SECRET_KEY", "TENCENT_SMS_SDK_APP_ID", "TENCENT_SMS_SIGN_NAME", "TENCENT_SMS_TEMPLATE_ID"],
    },
}


STOCKS: dict[str, dict[str, Any]] = {
    "600519": {
        "code": "600519",
        "name": "贵州茅台",
        "market": "cn",
        "industry": "白酒",
        "price": "1,586.20",
        "change": "+0.84%",
        "performance": {"day": 0.84, "week": 2.42, "month": -1.16},
        "sparkline": [42, 45, 44, 49, 47, 51, 55, 53, 58, 61],
        "chart": [1542, 1556, 1549, 1571, 1564, 1580, 1593, 1588, 1604, 1586],
        "tone": "neutral",
        "pulse": "现金流稳定，关注估值和消费修复。",
        "updated": "今日 15:08",
        "score": 78,
        "tags": ["现金流强", "消费复苏", "估值敏感"],
        "idea": {
            "stance": "继续研究",
            "horizon": "中长期",
            "reason": "经营质量和现金流稳定，适合作为消费龙头观察样本。",
            "risk": "估值对增长放缓较敏感，批价和库存若走弱会压制情绪。",
            "trigger": "若下一季收入恢复且批价稳定，研究优先级上调。",
        },
        "metrics": [["毛利率", "91.5%", "稳定"], ["净利增速", "15.7%", "放缓"], ["负债率", "19.3%", "较低"]],
        "signals": [
            {"title": "基本面", "level": "稳健", "text": "收入和利润质量仍处于头部水平，短期看渠道库存和高端消费恢复。"},
            {"title": "估值", "level": "偏贵", "text": "估值包含确定性溢价，业绩增速放缓会压制弹性。"},
            {"title": "新闻", "level": "中性", "text": "消息集中在批价、分红和消费修复，需结合财报看。"},
        ],
        "checklist": ["下一季收入增速是否继续低于利润增速", "批价和库存是否出现连续走弱", "分红率变化是否支持长期资金配置"],
    },
    "300750": {
        "code": "300750",
        "name": "宁德时代",
        "market": "cn",
        "industry": "动力电池",
        "price": "188.64",
        "change": "-1.12%",
        "performance": {"day": -1.12, "week": 3.18, "month": 7.64},
        "sparkline": [40, 39, 42, 45, 44, 48, 51, 49, 53, 52],
        "chart": [176, 181, 180, 184, 187, 192, 190, 195, 191, 188],
        "tone": "warning",
        "pulse": "动量改善，但利润率压力仍高。",
        "updated": "今日 14:56",
        "score": 66,
        "tags": ["新能源", "价格竞争", "全球化"],
        "idea": {
            "stance": "波动观察",
            "horizon": "中短期",
            "reason": "行业龙头地位仍强，周/月维度动量改善明显。",
            "risk": "产业链价格竞争和毛利率变化会放大股价波动。",
            "trigger": "若海外订单和储能增长继续兑现，动量信号增强。",
        },
        "metrics": [["毛利率", "22.4%", "承压"], ["研发费用", "高", "投入强"], ["现金储备", "充足", "安全垫"]],
        "signals": [
            {"title": "基本面", "level": "分化", "text": "龙头地位仍在，价格竞争继续影响利润率预期。"},
            {"title": "估值", "level": "需观察", "text": "估值已回落，弹性看海外收入、储能和毛利率。"},
            {"title": "新闻", "level": "偏敏感", "text": "订单、贸易政策和电池价格会影响短期情绪。"},
        ],
        "checklist": ["动力电池价格是否继续下探", "海外工厂和客户订单是否按计划推进", "储能业务是否能贡献更稳定利润"],
    },
    "000001": {
        "code": "000001",
        "name": "平安银行",
        "market": "cn",
        "industry": "银行",
        "price": "10.72",
        "change": "+0.19%",
        "performance": {"day": 0.19, "week": -0.72, "month": 1.86},
        "sparkline": [44, 43, 42, 44, 45, 43, 46, 47, 46, 48],
        "chart": [10.42, 10.36, 10.48, 10.55, 10.51, 10.63, 10.58, 10.69, 10.66, 10.72],
        "tone": "safe",
        "pulse": "低估值高股息，关注息差和资产质量。",
        "updated": "今日 15:01",
        "score": 72,
        "tags": ["高股息", "低估值", "息差压力"],
        "idea": {
            "stance": "防御配置",
            "horizon": "中期",
            "reason": "估值处于低位，高股息属性对组合波动有一定缓冲。",
            "risk": "息差收窄和资产质量变化会影响重估空间。",
            "trigger": "若分红政策稳定且资产质量改善，配置吸引力提升。",
        },
        "metrics": [["市净率", "0.48x", "较低"], ["股息率", "较高", "防御"], ["不良率", "平稳", "需跟踪"]],
        "signals": [
            {"title": "基本面", "level": "防御", "text": "盈利弹性一般，估值和分红提供一定安全边际。"},
            {"title": "估值", "level": "低位", "text": "当前估值反映息差和地产链风险担忧。"},
            {"title": "新闻", "level": "低波动", "text": "重点看政策、地产信用和分红方案。"},
        ],
        "checklist": ["净息差是否继续收窄", "涉房资产风险是否稳定", "分红政策是否维持"],
    },
}

A_STOCK_SEARCH_SEEDS: list[dict[str, str]] = [
    {"code": "601727", "name": "上海电气", "industry": "电气设备"},
    {"code": "600875", "name": "东方电气", "industry": "电气设备"},
    {"code": "688660", "name": "电气风电", "industry": "风电设备"},
    {"code": "600312", "name": "平高电气", "industry": "电网设备"},
    {"code": "000400", "name": "许继电气", "industry": "电网设备"},
    {"code": "002028", "name": "思源电气", "industry": "电网设备"},
    {"code": "300001", "name": "特锐德", "industry": "电气设备"},
    {"code": "300274", "name": "阳光电源", "industry": "电源设备"},
    {"code": "601179", "name": "中国西电", "industry": "电网设备"},
    {"code": "600406", "name": "国电南瑞", "industry": "电网自动化"},
    {"code": "601012", "name": "隆基绿能", "industry": "光伏设备"},
    {"code": "600089", "name": "特变电工", "industry": "电力设备"},
    {"code": "300124", "name": "汇川技术", "industry": "工业自动化"},
    {"code": "002202", "name": "金风科技", "industry": "风电设备"},
    {"code": "002129", "name": "TCL中环", "industry": "光伏设备"},
    {"code": "600438", "name": "通威股份", "industry": "光伏设备"},
    {"code": "601877", "name": "正泰电器", "industry": "低压电器"},
    {"code": "002074", "name": "国轩高科", "industry": "动力电池"},
    {"code": "002594", "name": "比亚迪", "industry": "新能源汽车"},
    {"code": "601857", "name": "中国石油", "industry": "石油石化"},
]

STOCK_DIRECTORY_CACHE: dict[str, Any] = {"loadedAt": 0.0, "items": A_STOCK_SEARCH_SEEDS}


MARKET_OVERVIEW = {
    "market": "cn",
    "updated": "15:20",
    "breadth": 63,
    "mood": "偏强",
    "summary": "上涨家数占优，消费电子和新能源偏强。",
    "indices": [
        {"name": "沪深300", "value": "3,612.48", "change": "+0.62%"},
        {"name": "创业板指", "value": "1,826.30", "change": "+0.88%"},
        {"name": "上证指数", "value": "3,108.42", "change": "+0.37%"},
    ],
    "sectors": [
        {"name": "消费电子", "change": "+1.84%", "tone": "up"},
        {"name": "动力电池", "change": "+1.12%", "tone": "up"},
        {"name": "银行", "change": "-0.21%", "tone": "down"},
    ],
    "globalMarkets": [
        {"id": "cn", "name": "A股", "mood": "偏强", "metric": "上涨占比", "value": "63%", "change": "+0.37%", "source": "实时监看"},
        {"id": "hk", "name": "港股", "mood": "分化", "metric": "上涨占比", "value": "49%", "change": "-0.28%", "source": "监看位"},
        {"id": "us", "name": "美股", "mood": "温和", "metric": "上涨占比", "value": "58%", "change": "+0.41%", "source": "监看位"},
    ],
    "marketDetails": {
        "cn": {
            "name": "A股",
            "summary": "上涨家数占优，消费电子和新能源偏强。",
            "indices": [
                {"name": "沪深300", "value": "3,612.48", "change": "+0.62%"},
                {"name": "创业板指", "value": "1,826.30", "change": "+0.88%"},
                {"name": "上证指数", "value": "3,108.42", "change": "+0.37%"},
            ],
            "sectors": [
                {"name": "消费电子", "change": "+1.84%", "tone": "up"},
                {"name": "动力电池", "change": "+1.12%", "tone": "up"},
                {"name": "银行", "change": "-0.21%", "tone": "down"},
            ],
        },
        "hk": {
            "name": "港股",
            "breadth": 49,
            "summary": "港股更受互联网龙头、地产链和南向资金影响，当前适合作为风险偏好观察窗口。",
            "indices": [
                {"name": "恒生指数", "value": "18,142.60", "change": "+0.18%"},
                {"name": "恒生科技", "value": "4,238.11", "change": "-0.28%"},
                {"name": "国企指数", "value": "6,421.08", "change": "+0.09%"},
            ],
            "sectors": [
                {"name": "互联网", "change": "+1.22%", "tone": "up"},
                {"name": "保险", "change": "+0.41%", "tone": "up"},
                {"name": "地产", "change": "-0.86%", "tone": "down"},
                {"name": "医药", "change": "-0.34%", "tone": "down"},
            ],
        },
        "us": {
            "name": "美股",
            "breadth": 58,
            "summary": "美股重点看大型科技、AI 算力、利率预期和财报节奏，适合观察全球风险偏好。",
            "indices": [
                {"name": "纳斯达克", "value": "18,804.03", "change": "+0.41%"},
                {"name": "标普500", "value": "5,432.80", "change": "+0.26%"},
                {"name": "道琼斯", "value": "39,118.20", "change": "-0.12%"},
            ],
            "sectors": [
                {"name": "大型科技", "change": "+0.92%", "tone": "up"},
                {"name": "半导体", "change": "+0.66%", "tone": "up"},
                {"name": "消费", "change": "+0.33%", "tone": "up"},
                {"name": "能源", "change": "-0.38%", "tone": "down"},
            ],
        },
    },
}

DEFAULT_ALERT_SETTINGS = {
    "enabled": True,
    "channels": ["手机系统通知"],
    "rules": ["出现公告或财报更新", "建议发生变化", "跌破支撑或接近压力"],
    "checkIntervalMinutes": 15,
}

DEFAULT_DATA_STATUS = {
    "mode": "demo",
    "source": "seed",
    "lastRefresh": None,
    "message": "当前使用演示数据。",
    "refreshedCodes": [],
}
DEFAULT_DIRECTORY_STATUS = {
    "mode": "seed",
    "source": "seed",
    "lastRefresh": None,
    "message": "当前使用内置股票目录，后台会自动同步全量 A 股名称。",
    "count": len(A_STOCK_SEARCH_SEEDS),
}

MARKET_REFRESH_MINUTES = 15
DIRECTORY_REFRESH_MINUTES = 24 * 60
ALERT_CHECK_INTERVAL_MINUTES = 15
QUOTE_CACHE_MINUTES = 3
HISTORY_CACHE_MINUTES = 12 * 60
NEWS_CACHE_MINUTES = 60
BACKGROUND_TASK_TICK_SECONDS = 30
BACKGROUND_TASKS = {
    "portfolio_quotes": {"label": "持仓行情刷新", "intervalMinutes": QUOTE_CACHE_MINUTES},
    "watchlist_quotes": {"label": "观察池行情刷新", "intervalMinutes": QUOTE_CACHE_MINUTES},
    "news_cache": {"label": "新闻公告缓存", "intervalMinutes": NEWS_CACHE_MINUTES},
    "alert_check": {"label": "提醒规则检查", "intervalMinutes": ALERT_CHECK_INTERVAL_MINUTES},
    "stock_directory": {"label": "A股股票目录同步", "intervalMinutes": DIRECTORY_REFRESH_MINUTES},
    "market_universe": {"label": "全市场行情同步", "intervalMinutes": MARKET_REFRESH_MINUTES},
}

RATE_LIMIT_RULES = {
    "/api/auth/sms/send": {"limit": 5, "windowSeconds": 300},
    "/api/auth/sms/login": {"limit": 12, "windowSeconds": 300},
    "/api/data/refresh": {"limit": 20, "windowSeconds": 300},
    "/api/data/sync-universe": {"limit": 6, "windowSeconds": 300},
    "/api/data/sync-stock-directory": {"limit": 4, "windowSeconds": 300},
    "/api/stocks/search": {"limit": 90, "windowSeconds": 60},
}
RATE_LIMIT_BUCKETS: dict[str, list[float]] = {}

INDUSTRY_BUCKETS = [
    ("医疗", ["医疗", "医药", "生物", "药", "医院", "健康", "器械", "疫苗", "诊断"]),
    ("光电", ["光电", "光学", "光伏", "激光", "显示", "面板", "led", "视觉"]),
    ("存储", ["存储", "芯片", "半导体", "集成", "电子", "微", "晶", "硅", "封测"]),
    ("人工智能", ["智能", "ai", "算法", "数据", "云", "软件", "科技", "信息"]),
    ("机器人", ["机器人", "自动化", "机床", "精密", "伺服", "控制"]),
    ("新能源", ["新能源", "锂", "电池", "储能", "能源", "风电", "太阳能"]),
    ("汽车链", ["汽车", "车", "汽配", "轮胎", "电机", "驱动"]),
    ("消费电子", ["消费电子", "手机", "通讯", "通信", "声学", "摄像", "终端"]),
    ("白酒消费", ["白酒", "酒", "食品", "饮料", "消费", "乳", "味"]),
    ("金融", ["银行", "证券", "保险", "金融", "信托"]),
    ("地产基建", ["地产", "建筑", "建材", "水泥", "装饰", "工程", "基建"]),
    ("军工", ["军工", "航天", "航空", "卫星", "导航", "船舶", "兵"]),
    ("有色资源", ["有色", "铜", "铝", "金", "矿", "稀土", "资源", "石油", "煤"]),
]

PINYIN_INITIAL_RANGES = [
    (-20319, -20284, "a"), (-20283, -19776, "b"), (-19775, -19219, "c"),
    (-19218, -18711, "d"), (-18710, -18527, "e"), (-18526, -18240, "f"),
    (-18239, -17923, "g"), (-17922, -17418, "h"), (-17417, -16475, "j"),
    (-16474, -16213, "k"), (-16212, -15641, "l"), (-15640, -15166, "m"),
    (-15165, -14923, "n"), (-14922, -14915, "o"), (-14914, -14631, "p"),
    (-14630, -14150, "q"), (-14149, -14091, "r"), (-14090, -13319, "s"),
    (-13318, -12839, "t"), (-12838, -12557, "w"), (-12556, -11848, "x"),
    (-11847, -11056, "y"), (-11055, -10247, "z"),
]
PINYIN_INITIAL_OVERRIDES = {
    "平": "p", "安": "a", "银": "y", "行": "h",
    "中": "z", "国": "g", "石": "s", "油": "y",
    "贵": "g", "州": "z", "茅": "m", "台": "t",
    "宁": "n", "德": "d", "时": "s", "代": "d",
    "常": "c", "友": "y", "科": "k", "技": "j",
    "苏": "s", "大": "d", "维": "w", "格": "g",
    "悦": "y", "新": "x", "材": "c",
    "气": "q", "派": "p", "津": "j", "膜": "m",
    "船": "c", "特": "t", "富": "f", "信": "x",
}


class CodePayload(BaseModel):
    code: str = Field(min_length=1, max_length=12)


class PortfolioPayload(BaseModel):
    code: str = Field(min_length=1, max_length=12)
    amount: float | None = Field(default=None, gt=0)
    shares: int | None = Field(default=None, gt=0)
    costPrice: float | None = Field(default=None, gt=0)
    note: str | None = Field(default=None, max_length=120)


class PortfolioSellPayload(BaseModel):
    amount: float | None = Field(default=None, gt=0)
    shares: int | None = Field(default=None, gt=0)
    price: float | None = Field(default=None, gt=0)
    note: str | None = Field(default=None, max_length=120)


class PortfolioUpdatePayload(BaseModel):
    amount: float | None = Field(default=None, gt=0)
    shares: int | None = Field(default=None, gt=0)
    costPrice: float | None = Field(default=None, gt=0)
    note: str | None = Field(default=None, max_length=120)


class AlertSettingsPayload(BaseModel):
    enabled: bool = True
    channels: list[str] = Field(default_factory=list)
    rules: list[str] = Field(default_factory=list)
    checkIntervalMinutes: int = Field(default=ALERT_CHECK_INTERVAL_MINUTES, ge=1, le=240)


class UserProfilePayload(BaseModel):
    displayName: str = Field(default=DEFAULT_USER_PROFILE["displayName"], min_length=1, max_length=32)
    riskLevel: str = Field(default=DEFAULT_USER_PROFILE["riskLevel"], max_length=12)
    defaultMarket: str = Field(default=DEFAULT_USER_PROFILE["defaultMarket"], max_length=12)


class PhoneCodePayload(BaseModel):
    phone: str = Field(min_length=6, max_length=20)


class PhoneLoginPayload(BaseModel):
    phone: str = Field(min_length=6, max_length=20)
    code: str = Field(min_length=4, max_length=8)


class WechatLoginPayload(BaseModel):
    code: str = Field(min_length=3, max_length=128)


class RefreshPayload(BaseModel):
    codes: list[str] | None = None


class TaskRunPayload(BaseModel):
    taskId: str | None = None


class TushareTokenPayload(BaseModel):
    token: str = Field(min_length=8)


class RecommendationFeedbackPayload(BaseModel):
    code: str = Field(min_length=1, max_length=12)
    action: str = Field(min_length=2, max_length=32)
    source: str = Field(default="home", max_length=32)


class ErrorAuditPayload(BaseModel):
    path: str = Field(max_length=160)
    message: str = Field(max_length=240)
    statusCode: int = Field(default=500, ge=400, le=599)


def clean_code(value: str) -> str:
    return "".join(ch for ch in value.upper() if ch.isalnum())[:8]


def pinyin_initials(value: str) -> str:
    initials = []
    for char in value:
        if char in PINYIN_INITIAL_OVERRIDES:
            initials.append(PINYIN_INITIAL_OVERRIDES[char])
            continue
        if char.isascii():
            if char.isalnum():
                initials.append(char.lower())
            continue
        try:
            encoded = char.encode("gb2312")
        except UnicodeEncodeError:
            continue
        if len(encoded) < 2:
            continue
        code = encoded[0] * 256 + encoded[1] - 65536
        for start, end, initial in PINYIN_INITIAL_RANGES:
            if start <= code <= end:
                initials.append(initial)
                break
    return "".join(initials)


def quote_symbol(code: str) -> str:
    clean = clean_code(code)
    prefix = "sh" if clean.startswith(("5", "6", "9")) else "sz"
    return f"{prefix}{clean}"


def tushare_symbol(code: str) -> str:
    clean = clean_code(code)
    suffix = "SH" if clean.startswith(("5", "6", "9")) else "SZ"
    return f"{clean}.{suffix}"


def eastmoney_secid(code: str) -> str:
    clean = clean_code(code)
    market = "1" if clean.startswith(("5", "6", "9")) else "0"
    return f"{market}.{clean}"


@contextmanager
def connect() -> sqlite3.Connection:
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    try:
        with db:
            yield db
    finally:
        db.close()


def to_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)


def from_json(value: str) -> Any:
    return json.loads(value)


def normalize_alert_settings(value: dict[str, Any] | None) -> dict[str, Any]:
    return {**DEFAULT_ALERT_SETTINGS, **(value or {})}


def current_user_id() -> str:
    return CURRENT_USER_ID.get()


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "local"


def enforce_rate_limit(request: Request) -> None:
    rule = RATE_LIMIT_RULES.get(request.url.path)
    if not rule:
        return
    now = time.time()
    window = float(rule["windowSeconds"])
    key = f"{client_ip(request)}:{request.url.path}"
    recent = [stamp for stamp in RATE_LIMIT_BUCKETS.get(key, []) if now - stamp < window]
    if len(recent) >= int(rule["limit"]):
        raise HTTPException(status_code=429, detail="too many requests")
    recent.append(now)
    RATE_LIMIT_BUCKETS[key] = recent


def record_error_audit(
    *,
    path: str,
    method: str,
    status_code: int,
    message: str,
    user_id: str | None = None,
    ip: str | None = None,
    payload: dict[str, Any] | None = None,
) -> None:
    with suppress(Exception):
        with connect() as db:
            db.execute(
                """
                INSERT INTO error_audit_logs (
                  id, user_id, path, method, status_code, message, ip, payload, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    secrets.token_hex(12),
                    user_id or current_user_id(),
                    path[:160],
                    method[:12],
                    int(status_code),
                    message[:240],
                    (ip or "")[:80],
                    to_json(payload or {}),
                    now_text(),
                ),
            )


def recent_error_audit(limit: int = 10) -> list[dict[str, Any]]:
    with connect() as db:
        rows = db.execute(
            """
            SELECT id, user_id, path, method, status_code, message, ip, payload, created_at
            FROM error_audit_logs
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (min(max(int(limit or 10), 1), 100),),
        ).fetchall()
    items = []
    for row in rows:
        payload: Any = {}
        with suppress(Exception):
            payload = from_json(row["payload"])
        items.append(
            {
                "id": row["id"],
                "userId": row["user_id"],
                "path": row["path"],
                "method": row["method"],
                "statusCode": int(row["status_code"] or 0),
                "message": row["message"],
                "ip": row["ip"],
                "payload": payload,
                "createdAt": row["created_at"],
            }
        )
    return items


def clean_phone(value: str) -> str:
    return "".join(ch for ch in value if ch.isdigit() or ch == "+")[:20]


def user_id_for_phone(phone: str) -> str:
    digest = hashlib.sha1(phone.encode("utf-8")).hexdigest()[:16]
    return f"phone_{digest}"


def device_name_from_headers(user_agent: str | None = None, device_name: str | None = None) -> str:
    if device_name and device_name.strip():
        return device_name.strip()[:80]
    agent = (user_agent or "").lower()
    if "iphone" in agent:
        return "iPhone"
    if "ipad" in agent:
        return "iPad"
    if "android" in agent:
        return "Android"
    if "safari" in agent or "chrome" in agent or "firefox" in agent:
        return "Web 设备"
    return "未知设备"


def create_auth_token(
    user_id: str,
    user_agent: str | None = None,
    device_name: str | None = None,
) -> dict[str, Any]:
    token = secrets.token_urlsafe(32)
    expires_at = (datetime.now() + timedelta(days=AUTH_TOKEN_EXPIRE_DAYS)).strftime("%Y-%m-%d %H:%M:%S")
    resolved_device = device_name_from_headers(user_agent, device_name)
    with connect() as db:
        db.execute(
            """
            INSERT INTO auth_sessions (
              token, user_id, device_name, user_agent, created_at, last_seen_at, expires_at, revoked_at
            )
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, NULL)
            """,
            (token, user_id, resolved_device, (user_agent or "")[:300], expires_at),
        )
    return {"token": token, "expiresAt": expires_at, "deviceName": resolved_device}


def bearer_token_from_header(authorization: str | None) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization.removeprefix("Bearer ").strip() or None


def cleanup_expired_sessions() -> None:
    with connect() as db:
        db.execute("DELETE FROM auth_sessions WHERE datetime(expires_at) <= datetime('now')")


def touch_auth_session(token: str | None) -> None:
    if not token:
        return
    with connect() as db:
        db.execute(
            "UPDATE auth_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token = ? AND revoked_at IS NULL",
            (token,),
        )


def session_public_id(token: str) -> str:
    return hashlib.sha1(token.encode("utf-8")).hexdigest()[:16]


def list_auth_devices(user_id: str, current_token: str | None = None) -> list[dict[str, Any]]:
    with connect() as db:
        rows = db.execute(
            """
            SELECT token, device_name, user_agent, created_at, last_seen_at, expires_at, revoked_at
            FROM auth_sessions
            WHERE user_id = ?
            ORDER BY revoked_at IS NOT NULL, last_seen_at DESC, created_at DESC
            LIMIT 20
            """,
            (user_id,),
        ).fetchall()
    return [
        {
            "id": session_public_id(row["token"]),
            "deviceName": row["device_name"] or "未知设备",
            "userAgent": row["user_agent"] or "",
            "createdAt": row["created_at"],
            "lastSeenAt": row["last_seen_at"],
            "expiresAt": row["expires_at"],
            "revokedAt": row["revoked_at"],
            "active": not bool(row["revoked_at"]) and bool(parse_refresh_time(row["expires_at"]) and parse_refresh_time(row["expires_at"]) > datetime.now()),
            "current": bool(current_token and row["token"] == current_token),
        }
        for row in rows
    ]


def auth_session_from_token(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    with connect() as db:
        row = db.execute(
            """
            SELECT token, user_id, device_name, user_agent, created_at, last_seen_at, expires_at, revoked_at
            FROM auth_sessions
            WHERE token = ? AND revoked_at IS NULL AND datetime(expires_at) > datetime('now')
            """,
            (token,),
        ).fetchone()
    if not row:
        return None
    expires_at = parse_refresh_time(row["expires_at"])
    should_refresh = bool(
        expires_at and expires_at - datetime.now() <= timedelta(days=AUTH_REFRESH_WINDOW_DAYS)
    )
    return {
        "token": row["token"],
        "userId": row["user_id"],
        "deviceName": row["device_name"],
        "userAgent": row["user_agent"],
        "createdAt": row["created_at"],
        "lastSeenAt": row["last_seen_at"],
        "expiresAt": row["expires_at"],
        "shouldRefresh": should_refresh,
    }


def user_id_from_token(token: str | None) -> str | None:
    session = auth_session_from_token(token)
    return session["userId"] if session else None


def auth_payload(
    user_id: str,
    token: str | None = None,
    expires_at: str | None = None,
    should_refresh: bool = False,
) -> dict[str, Any]:
    payload = {
        "authenticated": user_id != DEFAULT_USER_ID,
        "profile": user_profile_show(user_id),
        "userId": user_id,
        "shouldRefresh": should_refresh,
    }
    if token or expires_at:
        payload["token"] = token
        payload["expiresAt"] = expires_at
    if token:
        session = auth_session_from_token(token)
        if session:
            payload["session"] = {
                "deviceName": session["deviceName"],
                "createdAt": session["createdAt"],
                "lastSeenAt": session["lastSeenAt"],
                "expiresAt": session["expiresAt"],
            }
    return payload


def sms_provider_status() -> dict[str, Any]:
    config = SMS_PROVIDER_CONFIG.get(SMS_PROVIDER)
    if not config:
        return {
            "provider": SMS_PROVIDER,
            "name": "未知短信服务",
            "ready": False,
            "mode": "invalid",
            "missingEnv": [],
        }
    missing_env = [key for key in config["env"] if not os.getenv(key)]
    return {
        "provider": SMS_PROVIDER,
        "name": config["name"],
        "ready": config["ready"],
        "mode": "mock" if SMS_PROVIDER == "mock" else "production",
        "missingEnv": missing_env,
    }


def send_sms_code(phone: str, code: str) -> dict[str, Any]:
    status = sms_provider_status()
    if SMS_PROVIDER == "mock":
        return {
            **status,
            "sent": True,
            "message": "开发环境已生成验证码，未调用真实短信服务。",
        }
    if not status["ready"]:
        raise HTTPException(
            status_code=503,
            detail=f"短信服务 {status['name']} 尚未配置完整：{', '.join(status['missingEnv'])}",
        )

    # Real provider SDK calls are intentionally isolated here. Once credentials
    # are ready, this function can call Aliyun/Tencent SDK without touching login APIs.
    raise HTTPException(
        status_code=501,
        detail=f"{status['name']} SDK 调用尚未接入，当前只完成配置校验和接口结构。",
    )


def normalize_user_profile(row: sqlite3.Row | None = None) -> dict[str, Any]:
    if not row:
        return DEFAULT_USER_PROFILE.copy()
    return {
        "id": row["id"],
        "displayName": row["display_name"] or DEFAULT_USER_PROFILE["displayName"],
        "riskLevel": row["risk_level"] or DEFAULT_USER_PROFILE["riskLevel"],
        "defaultMarket": row["default_market"] or DEFAULT_USER_PROFILE["defaultMarket"],
    }


def risk_profile_rules(risk_level: str | None = None) -> dict[str, Any]:
    return RISK_PROFILE_RULES.get(risk_level or DEFAULT_USER_PROFILE["riskLevel"], RISK_PROFILE_RULES["稳健"])


def alert_settings_key(user_id: str | None = None) -> str:
    return f"alerts:{user_id or current_user_id()}"


def stock_price_number(stock: dict[str, Any]) -> float:
    return float(str(stock["price"]).replace(",", ""))


def now_text() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def parse_refresh_time(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y/%m/%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def market_data_is_stale(max_age_minutes: int = MARKET_REFRESH_MINUTES) -> bool:
    refreshed_at = parse_refresh_time(get_data_status().get("lastRefresh"))
    if refreshed_at is None:
        return True
    return datetime.now() - refreshed_at >= timedelta(minutes=max_age_minutes)


def timestamp_is_stale(value: str | None, max_age_minutes: int) -> bool:
    refreshed_at = parse_refresh_time(value)
    if refreshed_at is None:
        return True
    return datetime.now() - refreshed_at >= timedelta(minutes=max_age_minutes)


def stock_cache_is_stale(stock: dict[str, Any], cache_key: str, max_age_minutes: int) -> bool:
    return timestamp_is_stale(stock.get("cache", {}).get(cache_key), max_age_minutes)


def mark_stock_cache(stock: dict[str, Any], cache_key: str) -> dict[str, Any]:
    return {
        **stock,
        "cache": {
            **stock.get("cache", {}),
            cache_key: now_text(),
        },
    }


def get_stock_or_404(code: str) -> dict[str, Any]:
    clean = clean_code(code)
    with connect() as db:
        row = db.execute("SELECT payload FROM stocks WHERE code = ?", (clean,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="stock not found")
    return from_json(row["payload"])


def list_stocks() -> list[dict[str, Any]]:
    with connect() as db:
        rows = db.execute("SELECT payload FROM stocks ORDER BY code").fetchall()
    return [from_json(row["payload"]) for row in rows]


def list_watchlist_codes() -> list[str]:
    with connect() as db:
        rows = db.execute("SELECT code FROM watchlist ORDER BY created_at DESC").fetchall()
    return [row["code"] for row in rows]


def list_portfolio_codes() -> list[str]:
    with connect() as db:
        rows = db.execute("SELECT code FROM portfolio ORDER BY updated_at DESC").fetchall()
    return [row["code"] for row in rows]


def list_curated_stocks() -> list[dict[str, Any]]:
    curated_codes = ["600519", "300750", "000001"]
    stocks_by_code = {stock["code"]: stock for stock in list_stocks()}
    return [stocks_by_code[code] for code in curated_codes if code in stocks_by_code]


def build_stock_from_directory(code: str, name: str, industry: str = "A股") -> dict[str, Any]:
    clean = clean_code(code)
    seed = STOCKS.get(clean)
    if seed:
        return seed
    base_price = 0
    return {
        "code": clean,
        "name": name,
        "market": "cn",
        "industry": industry or "A股",
        "price": price_to_text(base_price),
        "change": "0.00%",
        "performance": {"day": 0, "week": 0, "month": 0},
        "sparkline": [42, 42, 43, 42, 44, 43, 45, 44, 45, 46],
        "chart": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "tone": "neutral",
        "pulse": "已找到股票名称，正在等待行情和历史 K 线补充。",
        "updated": "待同步",
        "score": 58,
        "tags": [industry or "A股", "待同步"],
        "idea": {
            "stance": "先观察",
            "horizon": "短中期",
            "reason": "已从股票名称目录匹配，后续会补充实时价格、K线和行业信息。",
            "risk": "行情和历史数据尚未完整同步，暂不适合直接做持仓判断。",
            "trigger": "行情同步完成后再查看趋势、估值和风险提示。",
        },
        "metrics": [["状态", "待同步", "行情"], ["分类", industry or "A股", "目录"], ["数据源", "股票名称表", "搜索"]],
        "signals": [
            {"title": "搜索", "level": "已匹配", "text": "企业名称和股票代码已识别。"},
            {"title": "行情", "level": "待同步", "text": "正在等待公开行情源返回价格。"},
            {"title": "分析", "level": "待补充", "text": "需要 K线、成交额和行业数据后再给出更具体建议。"},
        ],
        "checklist": ["同步实时价格", "补充历史 K线", "查看行业和公告变化"],
        "dataCoverage": {"quote": False, "history": False, "fundamental": False},
    }


def normalize_directory_item(item: dict[str, Any], source: str = "seed") -> dict[str, str]:
    code = clean_code(str(item.get("code", "")))
    name = str(item.get("name", "")).strip()
    industry = str(item.get("industry") or item.get("category") or "A股").strip() or "A股"
    initials = pinyin_initials(name)
    search_text = f"{code} {name.lower()} {initials} {industry.lower()}"
    return {
        "code": code,
        "name": name,
        "industry": industry,
        "initials": initials,
        "searchText": search_text,
        "source": source,
    }


def save_directory_status(status: dict[str, Any]) -> dict[str, Any]:
    with connect() as db:
        db.execute(
            """
            INSERT INTO app_settings (key, payload)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET payload = excluded.payload
            """,
            ("stock_directory_status", to_json(status)),
        )
    return status


def get_directory_status() -> dict[str, Any]:
    with connect() as db:
        row = db.execute("SELECT payload FROM app_settings WHERE key = ?", ("stock_directory_status",)).fetchone()
        count_row = db.execute("SELECT COUNT(*) AS count FROM stock_directory").fetchone()
    count = int(count_row["count"] or 0) if count_row else 0
    base = from_json(row["payload"]) if row else DEFAULT_DIRECTORY_STATUS
    return {**base, "count": count or int(base.get("count") or 0)}


def stock_directory_is_stale(max_age_minutes: int = DIRECTORY_REFRESH_MINUTES) -> bool:
    status = get_directory_status()
    return timestamp_is_stale(status.get("lastRefresh"), max_age_minutes)


def upsert_stock_directory(items: list[dict[str, Any]], source: str) -> int:
    normalized = []
    seen: set[str] = set()
    for item in items:
        next_item = normalize_directory_item(item, source)
        if len(next_item["code"]) != 6 or not next_item["name"] or next_item["code"] in seen:
            continue
        seen.add(next_item["code"])
        normalized.append(next_item)
    if not normalized:
        return 0
    now = now_text()
    with connect() as db:
        db.executemany(
            """
            INSERT INTO stock_directory (
              code, name, industry, initials, search_text, source, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET
              name = excluded.name,
              industry = excluded.industry,
              initials = excluded.initials,
              search_text = excluded.search_text,
              source = excluded.source,
              updated_at = excluded.updated_at
            """,
            [
                (
                    item["code"],
                    item["name"],
                    item["industry"],
                    item["initials"],
                    item["searchText"],
                    item["source"],
                    now,
                )
                for item in normalized
            ],
        )
    return len(normalized)


def seed_stock_directory() -> int:
    return upsert_stock_directory(A_STOCK_SEARCH_SEEDS, "seed")


def fetch_akshare_stock_directory() -> list[dict[str, str]]:
    import akshare as ak

    frame = ak.stock_info_a_code_name()
    code_column = "code" if "code" in frame.columns else "代码"
    name_column = "name" if "name" in frame.columns else "名称"
    items = []
    for _, row in frame.iterrows():
        code = clean_code(str(row.get(code_column, "")))
        name = str(row.get(name_column, "")).strip()
        if len(code) == 6 and name:
            items.append({"code": code, "name": name, "industry": "A股"})
    return items


def refresh_stock_directory(force: bool = False) -> dict[str, Any]:
    if not force and not stock_directory_is_stale():
        return get_directory_status()
    items = list(A_STOCK_SEARCH_SEEDS)
    source = "seed"
    errors: list[str] = []
    try:
        fetched_items = fetch_akshare_stock_directory()
        if fetched_items:
            items.extend(fetched_items)
            source = "akshare:stock_info_a_code_name"
    except Exception as error:
        errors.append(type(error).__name__)
    count = upsert_stock_directory(items, source)
    STOCK_DIRECTORY_CACHE.clear()
    status = {
        "mode": "live" if source.startswith("akshare") else "seed",
        "source": source,
        "lastRefresh": now_text(),
        "message": f"已同步 A股股票名称目录，共 {count} 只。" if count else "股票目录同步失败，继续使用已有缓存。",
        "count": count or get_directory_status().get("count", 0),
        "errors": errors,
    }
    return save_directory_status(status)


def stock_directory_rows(keyword: str = "", limit: int = 50) -> list[dict[str, str]]:
    raw_term = keyword.strip()
    code_term = clean_code(raw_term)
    normalized_term = raw_term.lower()
    limit = min(max(int(limit or 50), 1), 200)
    params: list[Any] = []
    where = ""
    if raw_term:
        like_terms = [f"{normalized_term}%", f"%{normalized_term}%", f"{code_term}%", f"%{code_term}%"]
        where = """
            WHERE name LIKE ?
               OR name LIKE ?
               OR code LIKE ?
               OR code LIKE ?
               OR initials LIKE ?
               OR search_text LIKE ?
        """
        params = [like_terms[0], like_terms[1], like_terms[2], like_terms[3], f"{normalized_term}%", f"%{normalized_term}%"]
    with connect() as db:
        rows = db.execute(
            f"""
            SELECT code, name, industry, initials, source, updated_at
            FROM stock_directory
            {where}
            ORDER BY
              CASE
                WHEN code = ? THEN 0
                WHEN name = ? THEN 1
                WHEN code LIKE ? THEN 2
                WHEN name LIKE ? THEN 3
                WHEN initials LIKE ? THEN 4
                ELSE 9
              END,
              code
            LIMIT ?
            """,
            [
                *params,
                code_term,
                raw_term,
                f"{code_term}%",
                f"{normalized_term}%",
                f"{normalized_term}%",
                limit,
            ],
        ).fetchall()
    return [
        {
            "code": row["code"],
            "name": row["name"],
            "industry": row["industry"],
            "initials": row["initials"],
            "source": row["source"],
            "updatedAt": row["updated_at"],
        }
        for row in rows
    ]


def stock_directory_items(max_age_minutes: int = 24 * 60, allow_network: bool = True) -> list[dict[str, str]]:
    rows = stock_directory_rows(limit=8000)
    if rows and (not allow_network or not stock_directory_is_stale(max_age_minutes)):
        STOCK_DIRECTORY_CACHE.update({"loadedAt": time.time(), "items": rows, "fullLoaded": len(rows) > len(A_STOCK_SEARCH_SEEDS)})
        return rows
    loaded_at = float(STOCK_DIRECTORY_CACHE.get("loadedAt") or 0)
    is_fresh = time.time() - loaded_at < max_age_minutes * 60
    is_full_directory = bool(STOCK_DIRECTORY_CACHE.get("fullLoaded"))
    if STOCK_DIRECTORY_CACHE.get("items") and is_fresh and (is_full_directory or not allow_network):
        return STOCK_DIRECTORY_CACHE["items"]
    items = list(A_STOCK_SEARCH_SEEDS)
    if allow_network:
        refresh_stock_directory(force=True)
        rows = stock_directory_rows(limit=8000)
        if rows:
            STOCK_DIRECTORY_CACHE.update({"loadedAt": time.time(), "items": rows, "fullLoaded": len(rows) > len(A_STOCK_SEARCH_SEEDS)})
            return rows
    deduped = list({item["code"]: item for item in items if item.get("code") and item.get("name")}.values())
    STOCK_DIRECTORY_CACHE.update({"loadedAt": time.time(), "items": deduped, "fullLoaded": False})
    return deduped


def directory_matches(keyword: str, limit: int = 25, allow_network: bool = False) -> list[dict[str, Any]]:
    raw_term = keyword.strip()
    if len(raw_term) < 2 and not clean_code(raw_term):
        return []
    normalized_term = raw_term.lower()
    code_term = clean_code(raw_term)
    scored_matches: list[tuple[float, dict[str, Any]]] = []
    for item in stock_directory_items(allow_network=allow_network):
        code = clean_code(item["code"])
        name = item["name"].strip()
        industry = item.get("industry", "A股")
        name_lower = name.lower()
        industry_lower = industry.lower()
        initials = pinyin_initials(name)
        score = 0
        if code_term and code.startswith(code_term):
            score += 120
        elif code_term and code_term in code:
            score += 80
        if normalized_term == name_lower:
            score += 110
        elif name_lower.startswith(normalized_term):
            score += 92
        elif normalized_term in name_lower:
            score += 78
        if normalized_term and initials.startswith(normalized_term):
            score += 70
        elif normalized_term and normalized_term in initials:
            score += 48
        if normalized_term in industry_lower:
            score += 30
        if not score:
            continue
        try:
            stock = get_stock_or_404(code)
        except HTTPException:
            stock = build_stock_from_directory(code, name, industry)
            upsert_stock(stock)
        scored_matches.append((score + float(stock.get("score", 0)) / 100, stock))
    return [stock for _, stock in sorted(scored_matches, key=lambda item: item[0], reverse=True)[:limit]]


def save_data_status(status: dict[str, Any]) -> dict[str, Any]:
    with connect() as db:
        db.execute(
            """
            INSERT INTO app_settings (key, payload)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET payload = excluded.payload
            """,
            ("data_status", to_json(status)),
        )
    return status


def get_data_status() -> dict[str, Any]:
    with connect() as db:
        row = db.execute("SELECT payload FROM app_settings WHERE key = ?", ("data_status",)).fetchone()
    return from_json(row["payload"]) if row else DEFAULT_DATA_STATUS


def get_tushare_token() -> str | None:
    env_token = os.environ.get("TUSHARE_TOKEN")
    if env_token:
        return env_token.strip()
    with connect() as db:
        row = db.execute("SELECT payload FROM app_settings WHERE key = ?", ("tushare_token",)).fetchone()
    if not row:
        return None
    return str(from_json(row["payload"]).get("token", "")).strip() or None


def save_tushare_token(token: str) -> None:
    with connect() as db:
        db.execute(
            """
            INSERT INTO app_settings (key, payload)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET payload = excluded.payload
            """,
            ("tushare_token", to_json({"token": token.strip()})),
        )


def upsert_stock(stock: dict[str, Any]) -> None:
    with connect() as db:
        db.execute(
            "INSERT OR REPLACE INTO stocks (code, payload) VALUES (?, ?)",
            (stock["code"], to_json(stock)),
        )


def number_or_none(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def quote_trade_date(quote: dict[str, Any]) -> str:
    raw_date = quote.get("date")
    if raw_date:
        return str(raw_date).replace("-", "")
    raw_datetime = quote.get("datetime")
    if raw_datetime:
        return raw_datetime.strftime("%Y%m%d")
    return datetime.now().strftime("%Y%m%d")


def compact_date_from_datetime(value: str | None) -> str:
    if not value:
        return datetime.now().strftime("%Y%m%d")
    with suppress(Exception):
        return datetime.fromisoformat(value.replace("Z", "").replace("T", " ")[:19]).strftime("%Y%m%d")
    return str(value)[:10].replace("-", "")


def pct_change(start: float, end: float) -> float:
    if start <= 0:
        return 0
    return round((end - start) / start * 100, 2)


def build_snapshot_values(code: str, quote: dict[str, Any], source: str) -> tuple[Any, ...] | None:
    close_price = number_or_none(quote_price_value(quote))
    if close_price is None or close_price <= 0:
        return None
    open_price = number_or_none(value_from_quote(quote, ["open", "openPrice"])) or close_price
    high = number_or_none(value_from_quote(quote, ["high"])) or max(open_price, close_price)
    low = number_or_none(value_from_quote(quote, ["low"])) or min(open_price, close_price)
    previous_close = number_or_none(value_from_quote(quote, ["close", "lastPrice"]))
    volume = number_or_none(value_from_quote(quote, ["turnover", "volume", "成交量(手)"]))
    amount = number_or_none(value_from_quote(quote, ["volume", "成交额(万)"]))
    trade_date = quote_trade_date(quote)
    return (
        clean_code(code),
        trade_date,
        open_price,
        high,
        low,
        close_price,
        previous_close,
        volume,
        amount,
        source,
        to_json(quote),
    )


def save_daily_snapshot(code: str, quote: dict[str, Any], source: str) -> None:
    values = build_snapshot_values(code, quote, source)
    if values is None:
        return
    with connect() as db:
        db.execute(
            """
            INSERT INTO stock_daily_snapshots (
              code, trade_date, open, high, low, close, pre_close,
              volume, amount, source, payload, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(code, trade_date) DO UPDATE SET
              open = excluded.open,
              high = excluded.high,
              low = excluded.low,
              close = excluded.close,
              pre_close = excluded.pre_close,
              volume = excluded.volume,
              amount = excluded.amount,
              source = excluded.source,
              payload = excluded.payload,
              created_at = CURRENT_TIMESTAMP
            """,
            values,
        )


def get_snapshot_rows(code: str, limit: int = 80) -> list[dict[str, Any]]:
    with connect() as db:
        rows = db.execute(
            """
            SELECT code, trade_date, open, high, low, close, pre_close, volume, amount, source
            FROM stock_daily_snapshots
            WHERE code = ?
            ORDER BY trade_date DESC
            LIMIT ?
            """,
            (clean_code(code), limit),
        ).fetchall()
    return [dict(row) for row in reversed(rows)]


def apply_snapshot_history(stock: dict[str, Any]) -> dict[str, Any]:
    existing_coverage = stock.get("dataCoverage", {})
    if existing_coverage.get("history") and stock.get("klineRows"):
        return stock

    rows = get_snapshot_rows(stock["code"], 80)
    if len(rows) < 2:
        return stock
    closes = [float(row["close"]) for row in rows]
    ten = rows[-10:] if len(rows) >= 10 else rows
    ten_closes = [float(row["close"]) for row in ten]
    spark_min = min(ten_closes)
    spark_range = max(ten_closes) - spark_min or 1
    last = rows[-1]
    stock = {**stock}
    stock["chart"] = [round(float(row["close"]), 2) for row in ten]
    stock["sparkline"] = [round(40 + ((float(row["close"]) - spark_min) / spark_range) * 22, 2) for row in ten]
    stock["performance"] = {
        **stock["performance"],
        "week": round((closes[-1] - closes[-5]) / closes[-5] * 100, 2) if len(closes) >= 5 else stock["performance"].get("week", 0),
        "month": round((closes[-1] - closes[-20]) / closes[-20] * 100, 2) if len(closes) >= 20 else stock["performance"].get("month", 0),
    }
    stock["klineRows"] = [
        {
            "date": row["trade_date"],
            "open": round(float(row["open"]), 2),
            "close": round(float(row["close"]), 2),
            "high": round(float(row["high"]), 2),
            "low": round(float(row["low"]), 2),
            "volume": row["volume"],
            "amount": row["amount"],
        }
        for row in ten
    ]
    stock["updated"] = f"快照 {last['trade_date']}"
    stock["dataCoverage"] = {
        **stock.get("dataCoverage", {}),
        "quote": True,
        "history": len(rows) >= 20,
        "snapshotDays": len(rows),
    }
    return stock


def value_from_row(row: Any, names: list[str], default: Any = None) -> Any:
    for name in names:
        try:
            value = row[name]
        except Exception:
            continue
        if value is not None and str(value) != "nan":
            return value
    return default


def format_change(value: Any) -> str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return "0.00%"
    sign = "+" if number > 0 else ""
    return f"{sign}{number:.2f}%"


def price_to_text(value: Any) -> str:
    try:
        return f"{float(value):,.2f}"
    except (TypeError, ValueError):
        return str(value)


def compact_yuan(value: Any) -> str | None:
    number = number_or_none(value)
    if number is None or number <= 0:
        return None
    if number >= 100000000:
        return f"{number / 100000000:.1f}亿"
    if number >= 10000:
        return f"{number / 10000:.1f}万"
    return f"{number:.0f}"


def compact_volume(value: Any) -> str | None:
    number = number_or_none(value)
    if number is None or number <= 0:
        return None
    if number >= 100000000:
        return f"{number / 100000000:.2f}亿"
    if number >= 10000:
        return f"{number / 10000:.0f}万"
    return f"{number:.0f}"


def fetch_eastmoney_quote_stats(code: str) -> dict[str, Any]:
    response = requests.get(
        "https://push2.eastmoney.com/api/qt/stock/get",
        params={
            "secid": eastmoney_secid(code),
            "fields": "f43,f44,f45,f46,f47,f48,f57,f58,f60,f116,f117,f162",
        },
        headers={
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://quote.eastmoney.com/",
        },
        timeout=12,
    )
    response.raise_for_status()
    data = response.json().get("data") or {}

    def scaled_price(field: str) -> float | None:
        number = number_or_none(data.get(field))
        return round(number / 100, 2) if number is not None and number > 0 else None

    return {
        "open": scaled_price("f46"),
        "previousClose": scaled_price("f60"),
        "dayHigh": scaled_price("f44"),
        "dayLow": scaled_price("f45"),
        "volume": compact_volume(data.get("f47")),
        "amount": compact_yuan(data.get("f48")),
        "marketCap": compact_yuan(data.get("f116")),
        "floatMarketCap": compact_yuan(data.get("f117")),
        "pe": round(float(data["f162"]) / 100, 2) if number_or_none(data.get("f162")) is not None else None,
    }


def update_stock_with_spot(stock: dict[str, Any], spot_row: Any) -> dict[str, Any]:
    day_change = float(value_from_row(spot_row, ["涨跌幅"], stock["performance"]["day"]) or 0)
    price = value_from_row(spot_row, ["最新价", "今收"], stock["price"])
    stock = {**stock}
    stock["name"] = str(value_from_row(spot_row, ["名称"], stock["name"]))
    stock["price"] = price_to_text(price)
    stock["change"] = format_change(day_change)
    stock["performance"] = {**stock["performance"], "day": day_change}
    stock["updated"] = f"实时 {datetime.now().strftime('%H:%M')}"
    stock["pulse"] = f"实时涨跌幅 {format_change(day_change)}，继续结合行业和财报观察。"
    return stock


def value_from_quote(quote: dict[str, Any], names: list[str], default: Any = None) -> Any:
    for name in names:
        value = quote.get(name)
        if value is not None and str(value) != "nan":
            return value
    return default


def quote_price_value(quote: dict[str, Any], default: Any = None) -> Any:
    for name in ["now", "price", "buy", "sell", "bid1", "ask1", "close", "lastPrice"]:
        value = value_from_quote(quote, [name], None)
        number = number_or_none(value)
        if number is not None and number > 0:
            return value
    return default


def quote_time_text(quote: dict[str, Any]) -> str:
    raw_datetime = quote.get("datetime")
    if raw_datetime:
        return f"实时 {raw_datetime.strftime('%H:%M')}"
    raw_time = quote.get("time")
    if raw_time:
        return f"实时 {str(raw_time)[:5]}"
    return f"实时 {datetime.now().strftime('%H:%M')}"


def update_stock_with_easy_quote(stock: dict[str, Any], quote: dict[str, Any]) -> dict[str, Any]:
    current_price = quote_price_value(quote, stock["price"])
    current_number = number_or_none(current_price)
    if current_number is None or current_number <= 0:
        return stock
    previous_close = value_from_quote(quote, ["close", "lastPrice"], None)
    change_percent = value_from_quote(quote, ["涨跌(%)", "increase"], None)
    if change_percent is None and previous_close:
        try:
            change_percent = (float(current_price) - float(previous_close)) / float(previous_close) * 100
        except (TypeError, ValueError, ZeroDivisionError):
            change_percent = stock["performance"]["day"]

    day_change = float(change_percent or 0)
    stock = {**stock}
    stock["name"] = str(value_from_quote(quote, ["name"], stock["name"]))
    stock["price"] = price_to_text(current_price)
    stock["change"] = format_change(day_change)
    stock["performance"] = {**stock["performance"], "day": round(day_change, 2)}
    stock["updated"] = quote_time_text(quote)
    stock["quote"] = {
        "source": "easyquotation",
        "open": value_from_quote(quote, ["open", "openPrice"]),
        "close": previous_close,
        "high": value_from_quote(quote, ["high"]),
        "low": value_from_quote(quote, ["low"]),
        "turnover": value_from_quote(quote, ["turnover"]),
        "volume": value_from_quote(quote, ["volume", "成交额(万)"]),
        "bid1": value_from_quote(quote, ["bid1"]),
        "ask1": value_from_quote(quote, ["ask1"]),
        "time": str(quote.get("datetime") or quote.get("time") or ""),
    }
    stock["quoteStats"] = {
        **stock.get("quoteStats", {}),
        "open": number_or_none(value_from_quote(quote, ["open", "openPrice"])),
        "previousClose": number_or_none(previous_close),
        "dayHigh": number_or_none(value_from_quote(quote, ["high"])),
        "dayLow": number_or_none(value_from_quote(quote, ["low"])),
        "volume": compact_volume(value_from_quote(quote, ["turnover", "volume", "成交量(手)"])),
        "amount": compact_yuan(value_from_quote(quote, ["volume", "成交额(万)"])),
        "source": "easyquotation",
    }
    existing_coverage = stock.get("dataCoverage", {})
    default_history = stock.get("industry") != "A股"
    stock["dataCoverage"] = {
        "quote": True,
        "history": bool(existing_coverage.get("history", default_history)),
        "fundamental": bool(existing_coverage.get("fundamental", default_history)),
    }
    stock["pulse"] = f"当前价 {stock['price']}，今日涨跌 {stock['change']}。"
    return stock


def build_stock_from_quote(code: str, quote: dict[str, Any]) -> dict[str, Any]:
    price = quote_price_value(quote, 0)
    price_number = number_or_none(price)
    if price_number is None or price_number <= 0:
        raise ValueError("invalid quote price")
    previous_close = value_from_quote(quote, ["close", "lastPrice"], price)
    chart_seed = []
    try:
        close = float(previous_close or price or 0)
        current = float(price or close)
        chart_seed = [
            round(close * 0.985, 2),
            round(close * 0.992, 2),
            round(close * 0.988, 2),
            round(close * 1.004, 2),
            round(close, 2),
            round((close + current) / 2, 2),
            round(current, 2),
            round(current * 1.003, 2),
            round(current * 0.997, 2),
            round(current, 2),
        ]
    except (TypeError, ValueError):
        chart_seed = [0] * 10

    stock = {
        "code": code,
        "name": str(value_from_quote(quote, ["name"], code)),
        "market": "cn",
        "industry": "A股",
        "price": price_to_text(price),
        "change": "0.00%",
        "performance": {"day": 0, "week": 0, "month": 0},
        "sparkline": [42, 43, 42, 45, 44, 46, 47, 46, 48, 48],
        "chart": chart_seed,
        "tone": "neutral",
        "pulse": "已接入实时行情，更多基本面分析待补充。",
        "updated": quote_time_text(quote),
        "score": 60,
        "tags": ["实时行情", "待分析"],
        "idea": {
            "stance": "先观察",
            "horizon": "短中期",
            "reason": "当前已能读取实时价格，后续需要结合行业、财报和资金面补充分析。",
            "risk": "暂缺完整基本面和历史指标，不能仅凭实时涨跌判断。",
            "trigger": "接入历史 K线和公告后可提升分析可信度。",
        },
        "metrics": [["当前价", price_to_text(price), "实时"], ["成交额", str(value_from_quote(quote, ["volume", "成交额(万)"], "-")), "跟踪"], ["数据源", "easyquotation", "已接入"]],
        "signals": [
            {"title": "行情", "level": "已接入", "text": "已从公开行情源获取实时/准实时价格。"},
            {"title": "分析", "level": "待补充", "text": "暂未计算完整技术指标和基本面评分。"},
            {"title": "风险", "level": "需谨慎", "text": "公开免费行情源可能存在延迟或临时不可用。"},
        ],
        "checklist": ["补充历史 K线", "补充行业和财报数据", "观察成交额和价格波动"],
        "dataCoverage": {"quote": True, "history": False, "fundamental": False},
    }
    return update_stock_with_easy_quote(stock, quote)


def fetch_easy_quotes(codes: list[str]) -> tuple[dict[str, dict[str, Any]], str]:
    import easyquotation

    prefixed_codes = [quote_symbol(code) for code in codes]
    last_error: Exception | None = None
    for provider in ("tencent", "sina"):
        try:
            quotation = easyquotation.use(provider)
            quotes = quotation.stocks(prefixed_codes, prefix=True)
            if quotes:
                return quotes, provider
        except Exception as error:
            last_error = error
    if last_error:
        raise last_error
    return {}, "easyquotation"


def fetch_easy_market_snapshot() -> tuple[dict[str, dict[str, Any]], str]:
    import easyquotation

    last_error: Exception | None = None
    for provider in ("tencent", "sina"):
        try:
            quotation = easyquotation.use(provider)
            quotes = quotation.market_snapshot(prefix=True)
            if quotes:
                return quotes, provider
        except Exception as error:
            last_error = error
    if last_error:
        raise last_error
    return {}, "easyquotation"


def sync_market_universe() -> dict[str, Any]:
    quotes, provider = fetch_easy_market_snapshot()
    synced = 0
    snapshotted = 0
    with connect() as db:
        for symbol, quote in quotes.items():
            code = clean_code(symbol[2:] if symbol[:2] in {"sh", "sz", "bj"} else symbol)
            if len(code) != 6 or not code[0].isdigit():
                continue
            row = db.execute("SELECT payload FROM stocks WHERE code = ?", (code,)).fetchone()
            existing = from_json(row["payload"]) if row else None
            try:
                stock = update_stock_with_easy_quote(existing, quote) if existing else build_stock_from_quote(code, quote)
            except ValueError:
                continue
            if stock_price_number(stock) <= 0:
                continue
            snapshot_values = build_snapshot_values(code, quote, f"easyquotation:{provider}")
            if snapshot_values:
                db.execute(
                    """
                    INSERT INTO stock_daily_snapshots (
                      code, trade_date, open, high, low, close, pre_close,
                      volume, amount, source, payload, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(code, trade_date) DO UPDATE SET
                      open = excluded.open,
                      high = excluded.high,
                      low = excluded.low,
                      close = excluded.close,
                      pre_close = excluded.pre_close,
                      volume = excluded.volume,
                      amount = excluded.amount,
                      source = excluded.source,
                      payload = excluded.payload,
                      created_at = CURRENT_TIMESTAMP
                    """,
                    snapshot_values,
                )
                snapshotted += 1
            db.execute(
                "INSERT OR REPLACE INTO stocks (code, payload) VALUES (?, ?)",
                (stock["code"], to_json(stock)),
            )
            synced += 1

    status = {
        "mode": "live",
        "source": f"easyquotation:{provider}",
        "lastRefresh": now_text(),
        "message": f"已同步 A股全市场行情，共 {synced} 只，并保存 {snapshotted} 条日快照。",
        "refreshedCodes": [],
        "universeCount": synced,
        "snapshotCount": snapshotted,
    }
    return save_data_status(status)


def ensure_market_universe(max_age_minutes: int = MARKET_REFRESH_MINUTES) -> dict[str, Any]:
    if not market_data_is_stale(max_age_minutes):
        return get_data_status()
    try:
        return sync_market_universe()
    except Exception as error:
        status = {
            **get_data_status(),
            "mode": "fallback",
            "message": "全市场行情刷新失败，继续使用最近一次缓存。",
            "lastAttempt": now_text(),
            "errors": [f"market-refresh:{type(error).__name__}"],
        }
        return save_data_status(status)


def recommendation_score(stock: dict[str, Any]) -> float:
    performance = stock.get("performance", {})
    return (
        float(performance.get("day", 0)) * 2.0
        + float(performance.get("month", 0)) * 0.45
        + float(stock.get("score", 60)) / 25
    )


def record_recommendation_feedback(
    code: str,
    action: str,
    source: str = "home",
    user_id: str | None = None,
) -> dict[str, Any]:
    clean = clean_code(code)
    stock = get_stock_or_404(clean)
    normalized_action = action.strip().lower()
    allowed_actions = {"view", "analyze", "watch", "dismiss", "portfolio"}
    if normalized_action not in allowed_actions:
        raise HTTPException(status_code=422, detail="unsupported feedback action")
    owner_id = user_id or current_user_id()
    payload = {
        "code": stock["code"],
        "name": stock["name"],
        "industry": stock.get("industry"),
        "action": normalized_action,
        "source": source,
        "modelVersion": RECOMMENDATION_MODEL_VERSION,
    }
    with connect() as db:
        db.execute(
            """
            INSERT INTO recommendation_feedback (
              id, user_id, code, action, source, payload, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """,
            (secrets.token_hex(12), owner_id, clean, normalized_action, source[:32], to_json(payload)),
        )
    return {**payload, "recorded": True}


def recommendation_feedback_summary(user_id: str | None = None, limit: int = 300) -> dict[str, Any]:
    owner_id = user_id or current_user_id()
    with connect() as db:
        rows = db.execute(
            """
            SELECT code, action, payload, created_at
            FROM recommendation_feedback
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (owner_id, limit),
        ).fetchall()
        watch_rows = db.execute("SELECT code FROM watchlist WHERE user_id = ?", (owner_id,)).fetchall()
        portfolio_rows = db.execute("SELECT code FROM portfolio WHERE user_id = ?", (owner_id,)).fetchall()

    code_scores: dict[str, float] = {}
    industry_scores: dict[str, float] = {}
    dismissed: set[str] = set()
    action_weight = {
        "view": 1.0,
        "analyze": 3.0,
        "watch": 4.0,
        "portfolio": 5.5,
        "dismiss": -8.0,
    }
    for index, row in enumerate(rows):
        recency = max(0.35, 1 - index / max(limit, 1))
        weight = action_weight.get(row["action"], 0) * recency
        code = clean_code(row["code"])
        code_scores[code] = code_scores.get(code, 0) + weight
        if row["action"] == "dismiss":
            dismissed.add(code)
        payload: Any = {}
        with suppress(Exception):
            payload = from_json(row["payload"])
        industry = payload.get("industry") if isinstance(payload, dict) else None
        if industry:
            industry_scores[industry] = industry_scores.get(industry, 0) + weight * 0.7

    for rows_for_boost, boost in ((watch_rows, 3.5), (portfolio_rows, 5.0)):
        for row in rows_for_boost:
            code = clean_code(row["code"])
            code_scores[code] = code_scores.get(code, 0) + boost
            with suppress(Exception):
                stock = get_stock_or_404(code)
                industry = stock.get("industry")
                if industry:
                    industry_scores[industry] = industry_scores.get(industry, 0) + boost * 0.6

    return {
        "codeScores": code_scores,
        "industryScores": industry_scores,
        "dismissed": dismissed,
        "eventCount": len(rows),
    }


def personalized_recommendation_score(stock: dict[str, Any], summary: dict[str, Any]) -> float:
    base_score = recommendation_score(stock)
    code = stock["code"]
    industry = stock.get("industry") or ""
    code_bonus = float(summary.get("codeScores", {}).get(code, 0))
    industry_bonus = float(summary.get("industryScores", {}).get(industry, 0))
    dismiss_penalty = -12 if code in summary.get("dismissed", set()) else 0
    quality = stock_data_quality(stock)
    quality_penalty = -10 if quality["score"] < 55 else -3 if quality["score"] < 70 else 0
    return base_score + code_bonus + industry_bonus + dismiss_penalty + quality_penalty


def build_user_persona(user_id: str | None = None) -> dict[str, Any]:
    owner_id = user_id or current_user_id()
    feedback = recommendation_feedback_summary(owner_id, limit=500)
    portfolio = portfolio_snapshot(owner_id)
    items = portfolio.get("items", [])
    industry_scores = dict(feedback.get("industryScores") or {})
    for item in items:
        industry = item.get("industry") or "未分类"
        industry_scores[industry] = industry_scores.get(industry, 0) + float(item.get("positionRatio") or 0) * 0.35
    top_industries = [
        {"name": name, "score": round(score, 2)}
        for name, score in sorted(industry_scores.items(), key=lambda pair: pair[1], reverse=True)
        if score > 0
    ][:5]
    with connect() as db:
        rows = db.execute(
            """
            SELECT action, COUNT(*) AS count
            FROM recommendation_feedback
            WHERE user_id = ?
            GROUP BY action
            """,
            (owner_id,),
        ).fetchall()
    actions = {row["action"]: int(row["count"] or 0) for row in rows}
    watch_count = actions.get("watch", 0)
    analyze_count = actions.get("analyze", 0) + actions.get("view", 0)
    dismiss_count = actions.get("dismiss", 0)
    if watch_count >= max(2, dismiss_count) and watch_count >= analyze_count * 0.6:
        style = "行动型观察者"
        style_text = "看到合适标的会较快加入观察池，推荐会更重视触发条件。"
    elif analyze_count >= watch_count + dismiss_count:
        style = "研究型用户"
        style_text = "更常查看分析后再行动，推荐会增加解释和风险提示权重。"
    elif dismiss_count >= watch_count:
        style = "筛选型用户"
        style_text = "会主动排除不感兴趣标的，推荐会减少重复和弱相关股票。"
    else:
        style = "稳健观察者"
        style_text = "当前行为较均衡，推荐会兼顾趋势、风险和行业分散。"
    holding_style = "未形成持仓画像"
    if items:
        top_ratio = max(float(item.get("positionRatio") or 0) for item in items)
        gain_rates = [float(item.get("totalGainRate") or 0) for item in items]
        if top_ratio >= 45:
            holding_style = "集中持仓"
        elif len(items) >= 5 and top_ratio <= 30:
            holding_style = "分散持仓"
        elif sum(1 for value in gain_rates if value < 0) >= max(2, len(gain_rates) // 2):
            holding_style = "修复观察"
        else:
            holding_style = "均衡持仓"
    persona = {
        "userId": owner_id,
        "version": "persona-v1",
        "style": style,
        "styleText": style_text,
        "holdingStyle": holding_style,
        "topIndustries": top_industries,
        "actions": actions,
        "updatedAt": now_text(),
    }
    with connect() as db:
        db.execute(
            """
            INSERT INTO user_personas (user_id, payload, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
              payload = excluded.payload,
              updated_at = CURRENT_TIMESTAMP
            """,
            (owner_id, to_json(persona)),
        )
    return persona


def user_persona_show(user_id: str | None = None) -> dict[str, Any]:
    owner_id = user_id or current_user_id()
    with connect() as db:
        row = db.execute("SELECT payload, updated_at FROM user_personas WHERE user_id = ?", (owner_id,)).fetchone()
    if row and not timestamp_is_stale(row["updated_at"], 60):
        return from_json(row["payload"])
    return build_user_persona(owner_id)


def clamp_score(value: float) -> int:
    return max(0, min(100, round(value)))


def industry_model_rules(industry: str | None) -> dict[str, Any]:
    text = industry or ""
    for key, value in INDUSTRY_MODEL_RULES.items():
        if key != "default" and key in text:
            return value
    return INDUSTRY_MODEL_RULES["default"]


def source_reliability_label(source: str | None) -> tuple[int, str]:
    text = (source or "").lower()
    if "tushare" in text:
        return 92, "授权数据"
    if "eastmoney" in text or "东方财富" in text:
        return 82, "公开数据"
    if "easyquotation" in text or "tencent" in text or "sina" in text:
        return 72, "公开行情"
    if "akshare" in text:
        return 68, "聚合数据"
    if "cache" in text or "sqlite" in text:
        return 58, "缓存数据"
    if "seed" in text or "demo" in text:
        return 35, "演示数据"
    return 50, "来源待确认"


def stock_source_trust(stock: dict[str, Any]) -> dict[str, Any]:
    quote_source = str((stock.get("quote") or {}).get("source") or (stock.get("quoteStats") or {}).get("source") or "cache")
    history_source = str(stock.get("historyProvider") or stock.get("klineSource") or ("snapshot-cache" if stock.get("klineRows") else "missing"))
    news_source = "news-cache" if (stock.get("newsImpact") or {}).get("items") else "missing"
    fundamental_source = str((stock.get("quoteStats") or {}).get("fundamentalSource") or ("quoteStats" if (stock.get("quoteStats") or {}).get("marketCap") else "missing"))
    sources = [
        {"type": "quote", "label": "实时行情", "source": quote_source, "available": bool(stock.get("dataCoverage", {}).get("quote"))},
        {"type": "history", "label": "历史K线", "source": history_source, "available": bool(stock.get("dataCoverage", {}).get("history") or stock.get("klineRows"))},
        {"type": "news", "label": "新闻公告", "source": news_source, "available": bool((stock.get("newsImpact") or {}).get("items"))},
        {"type": "fundamental", "label": "基本面", "source": fundamental_source, "available": bool(stock.get("dataCoverage", {}).get("fundamental") or (stock.get("quoteStats") or {}).get("marketCap"))},
    ]
    scored = []
    for item in sources:
        score, label = source_reliability_label(item["source"])
        if not item["available"]:
            score = 15
            label = "缺失"
        scored.append({**item, "score": score, "trustLabel": label})
    average = round(sum(item["score"] for item in scored) / len(scored))
    if average >= 78:
        trust_label = "可信度高"
    elif average >= 58:
        trust_label = "基本可信"
    else:
        trust_label = "需要补充"
    return {
        "score": average,
        "label": trust_label,
        "sources": scored,
        "updated": stock.get("updated") or now_text(),
    }


def stock_data_quality(stock: dict[str, Any]) -> dict[str, Any]:
    coverage = stock.get("dataCoverage") or {}
    stats = stock.get("quoteStats") or {}
    history_rows = stock.get("klineRows") or []
    has_quote = bool(coverage.get("quote")) and stock_price_number(stock) > 0
    has_history = bool(coverage.get("history")) or len(history_rows) >= 20
    has_fundamental = bool(coverage.get("fundamental")) or bool(stats.get("marketCap") or stock.get("marketCap"))
    quote_score = 35 if has_quote else 8
    history_score = 35 if has_history else 8 + min(12, len(history_rows))
    fundamental_score = 20 if has_fundamental else 6
    freshness_score = 10
    score = clamp_score(quote_score + history_score + fundamental_score + freshness_score)
    if score >= 80:
        label = "数据充足"
    elif score >= 60:
        label = "基本可用"
    else:
        label = "需要补充"
    warnings: list[str] = []
    if not has_quote:
        warnings.append("实时行情不足，建议仅作观察。")
    if not has_history:
        warnings.append("历史K线不足，趋势和回测置信度会下降。")
    if not has_fundamental:
        warnings.append("市值或基本面字段待补充，基本面判断偏保守。")
    if not warnings:
        warnings.append("当前数据覆盖较完整，但免费行情源仍可能延迟。")
    source_trust = stock_source_trust(stock)
    return {
        "score": score,
        "label": label,
        "quote": "正常" if has_quote else "缺失",
        "history": "充足" if has_history else "不足",
        "fundamental": "可用" if has_fundamental else "待补充",
        "historyRows": len(history_rows),
        "warnings": warnings[:3],
        "sourceTrust": source_trust,
        "updated": stock.get("updated") or now_text(),
    }


def compliance_disclosure(confidence_label: str | None = None) -> dict[str, Any]:
    return {
        **COMPLIANCE_DISCLOSURE,
        "confidenceLabel": confidence_label or "中",
    }


def history_closes(stock: dict[str, Any]) -> list[float]:
    rows = stock.get("klineRows") or []
    closes = [number_or_none(row.get("close")) for row in rows]
    closes = [value for value in closes if value is not None and value > 0]
    if closes:
        return closes
    return [float(value) for value in stock.get("chart", []) if number_or_none(value) is not None]


def volatility_percent(closes: list[float]) -> float:
    if len(closes) < 5:
        return 0
    recent = closes[-10:]
    average = sum(recent) / len(recent)
    if average <= 0:
        return 0
    return round((max(recent) - min(recent)) / average * 100, 2)


def moving_average(values: list[float], window: int) -> float | None:
    if len(values) < window:
        return None
    recent = values[-window:]
    return sum(recent) / window


def percent_move(values: list[float], window: int) -> float:
    if len(values) <= window:
        return 0
    previous = values[-window - 1]
    current = values[-1]
    if previous <= 0:
        return 0
    return (current - previous) / previous * 100


def build_stock_forecast(stock: dict[str, Any]) -> dict[str, Any]:
    performance = stock.get("performance", {})
    day = float(performance.get("day", 0) or 0)
    week = float(performance.get("week", 0) or 0)
    month = float(performance.get("month", 0) or 0)
    closes = history_closes(stock)
    volatility = volatility_percent(closes)
    ma5 = moving_average(closes, 5)
    ma10 = moving_average(closes, 10)
    ma20 = moving_average(closes, 20)
    move5 = percent_move(closes, 5)
    move20 = percent_move(closes, 20)
    quoted_price = stock_price_number(stock)
    current = quoted_price or (closes[-1] if closes else None)
    data_coverage = stock.get("dataCoverage", {})
    news_counts = (stock.get("newsImpact") or {}).get("counts") or {}
    total_news = sum(int(value or 0) for value in news_counts.values())

    trend_points = 0
    if ma5 and ma10:
        trend_points += 10 if ma5 >= ma10 else -10
    if ma10 and ma20:
        trend_points += 10 if ma10 >= ma20 else -10
    if ma20 and current:
        trend_points += 8 if current >= ma20 else -8

    momentum_points = day * 1.8 + week * 1.25 + month * 0.55 + move5 * 0.9 + move20 * 0.35
    news_points = int(news_counts.get("positive", 0) or 0) * 3 - int(news_counts.get("negative", 0) or 0) * 4
    volatility_penalty = min(18, volatility * 0.7 + abs(day) * 1.4)
    data_penalty = 0 if data_coverage.get("history") else 8

    base_probability = 50 + trend_points * 0.75 + momentum_points + news_points - volatility_penalty - data_penalty
    probability_5d = clamp_score(base_probability)
    probability_20d = clamp_score(50 + trend_points * 0.9 + month * 1.15 + move20 * 0.65 + news_points - volatility_penalty * 0.7 - data_penalty)
    risk_score = clamp_score(88 - volatility * 1.5 - abs(day) * 3.2 - (0 if data_coverage.get("history") else 12))
    recent_levels = closes[-20:] if closes else []
    if current:
        recent_levels = [*recent_levels, current]
    support = min(recent_levels) if recent_levels else current
    resistance = max(recent_levels) if recent_levels else current
    distance_to_support = (max(0, current - support) / support * 100) if current and support and support > 0 else None
    distance_to_resistance = (max(0, resistance - current) / current * 100) if current and resistance and current > 0 else None
    confidence_score = clamp_score(
        28
        + min(22, len(closes) * 1.2)
        + (18 if data_coverage.get("history") else 0)
        + (16 if data_coverage.get("quote") else 0)
        + (8 if stock.get("marketCap") else 0)
        + min(8, total_news * 2)
    )
    if confidence_score >= 78:
        confidence_label = "高"
    elif confidence_score >= 58:
        confidence_label = "中"
    else:
        confidence_label = "低"

    if probability_20d >= 66 and risk_score >= 55:
        label = "偏强"
        stance = "可继续观察，适合等回调或确认后再加仓。"
    elif probability_20d >= 56:
        label = "中性偏强"
        stance = "可以跟踪，但不适合只凭短期涨幅重仓。"
    elif probability_20d <= 42 or risk_score <= 42:
        label = "偏弱"
        stance = "先控制仓位，等待趋势和成交改善。"
    else:
        label = "震荡"
        stance = "方向还不清晰，适合观察支撑位和消息面。"

    factors = [
        {
            "name": "均线结构",
            "score": clamp_score(55 + trend_points),
            "text": "MA5、MA10、MA20 用于判断短中期趋势是否同向。",
        },
        {
            "name": "动量",
            "score": clamp_score(50 + momentum_points),
            "text": f"今日 {format_change(day)}，近一周 {format_change(week)}，近一月 {format_change(month)}。",
        },
        {
            "name": "波动风险",
            "score": risk_score,
            "text": f"近阶段振幅约 {volatility:.2f}%，分数越低代表波动越大。",
        },
        {
            "name": "数据可信度",
            "score": clamp_score(60 + (22 if data_coverage.get("history") else -12) + (12 if data_coverage.get("quote") else -10)),
            "text": "历史K线、实时价和基础字段越完整，模型越稳定。",
        },
    ]
    watch_points: list[str] = []
    if probability_20d >= 60:
        watch_points.append("确认能否站稳短期均线，回调不破支撑更健康。")
    elif probability_20d <= 42:
        watch_points.append("先看价格能否止跌，别只因为跌多就急着加仓。")
    else:
        watch_points.append("重点观察是否放量突破压力位，方向确认后再行动。")
    if distance_to_resistance is not None and distance_to_resistance <= 3:
        watch_points.append("价格接近短期压力位，突破失败容易回落。")
    elif distance_to_support is not None and distance_to_support <= 3:
        watch_points.append("价格接近短期支撑位，跌破需要重新评估风险。")
    if total_news:
        watch_points.append("结合公告、财报和行业消息确认走势是否有基本面支撑。")

    risk_warnings: list[str] = []
    if volatility >= 8 or abs(day) >= 5:
        risk_warnings.append("短期波动偏大，仓位不宜一次打满。")
    if month <= -8:
        risk_warnings.append("近一月走势偏弱，反弹前先看企稳。")
    if day >= 6:
        risk_warnings.append("单日涨幅较高，追高容易买在情绪高点。")
    if not data_coverage.get("history"):
        risk_warnings.append("历史K线不足，模型置信度会下降。")
    if not risk_warnings:
        risk_warnings.append("主要风险来自市场情绪和行业消息突然变化。")

    return {
        "version": FORECAST_MODEL_VERSION,
        "horizon": "5日 / 20日",
        "label": label,
        "probability5d": probability_5d,
        "probability20d": probability_20d,
        "riskScore": risk_score,
        "confidence": {
            "score": confidence_score,
            "label": confidence_label,
        },
        "keyLevels": {
            "support": round(support, 2) if support else None,
            "resistance": round(resistance, 2) if resistance else None,
            "distanceToSupport": round(distance_to_support, 2) if distance_to_support is not None else None,
            "distanceToResistance": round(distance_to_resistance, 2) if distance_to_resistance is not None else None,
        },
        "stance": stance,
        "summary": f"未来 5 日偏强概率 {probability_5d}%，20 日偏强概率 {probability_20d}%。{stance}",
        "factors": factors,
        "watchPoints": watch_points[:3],
        "riskWarnings": risk_warnings[:3],
        "modelInputs": {
            "historyDays": len(closes),
            "hasQuote": bool(data_coverage.get("quote")),
            "hasHistory": bool(data_coverage.get("history")),
            "newsCount": total_news,
        },
        "signals": {
            "ma5": round(ma5, 2) if ma5 else None,
            "ma10": round(ma10, 2) if ma10 else None,
            "ma20": round(ma20, 2) if ma20 else None,
            "move5": round(move5, 2),
            "move20": round(move20, 2),
            "volatility": volatility,
        },
        "disclaimer": "模型只做概率和风险观察，不构成证券投资建议。",
        "updated": now_text(),
    }


def build_stock_advice_engine(
    stock: dict[str, Any],
    holding: dict[str, Any] | None = None,
    concentration_ratio: float | None = None,
    risk_level: str | None = None,
) -> dict[str, Any]:
    performance = stock.get("performance", {})
    day = float(performance.get("day", 0) or 0)
    week = float(performance.get("week", 0) or 0)
    month = float(performance.get("month", 0) or 0)
    closes = history_closes(stock)
    volatility = volatility_percent(closes)
    current_price = stock_price_number(stock)
    data_coverage = stock.get("dataCoverage", {})
    data_quality = stock_data_quality(stock)
    news_impact = stock.get("newsImpact") or {}
    news_counts = news_impact.get("counts") or {}
    forecast = (stock.get("analysisScore") or {}).get("forecast") or build_stock_forecast(stock)
    forecast_probability = float(forecast.get("probability20d") or 50)
    forecast_risk_score = float(forecast.get("riskScore") or 50)
    forecast_confidence = float((forecast.get("confidence") or {}).get("score") or 50)
    risk_profile = risk_profile_rules(risk_level)
    industry_model = industry_model_rules(stock.get("industry"))
    model_weights = industry_model["weights"]
    total_gain_rate = float((holding or {}).get("totalGainRate", 0) or 0)
    position_ratio = float((holding or {}).get("positionRatio", 0) or 0)
    rules: list[dict[str, Any]] = []

    def add_rule(name: str, score: int, conclusion: str, reason: str, risk: str, weight: float) -> None:
        rules.append(
            {
                "name": name,
                "score": clamp_score(score),
                "conclusion": conclusion,
                "reason": reason,
                "risk": risk,
                "weight": weight,
            }
        )

    trend_score = 50 + month * 2.6 + week * 1.2
    if month >= 8 and week >= 0:
        trend_conclusion = "趋势偏强"
        trend_reason = f"近一月 {format_change(month)}，近一周 {format_change(week)}，价格惯性仍在。"
        trend_risk = "短期涨幅已释放，追高加仓容易承受回撤。"
    elif month <= -8:
        trend_conclusion = "趋势偏弱"
        trend_reason = f"近一月 {format_change(month)}，趋势修复还不充分。"
        trend_risk = "弱势阶段反弹可能持续性不足，需要等企稳信号。"
    elif month > 0:
        trend_conclusion = "温和修复"
        trend_reason = f"近一月 {format_change(month)}，方向改善但强度一般。"
        trend_risk = "如果成交额跟不上，修复可能变成区间震荡。"
    else:
        trend_conclusion = "方向不明确"
        trend_reason = f"近一月 {format_change(month)}，尚未形成清晰趋势。"
        trend_risk = "缺少趋势确认时，重仓持有的确定性不够。"
    add_rule("趋势", trend_score, trend_conclusion, trend_reason, trend_risk, model_weights["trend"])

    volatility_score = 86 - abs(day) * 5 - volatility * 1.2
    if abs(day) >= 5 or volatility >= 18:
        volatility_conclusion = "波动偏高"
        volatility_reason = f"今日 {format_change(day)}，近阶段价格振幅约 {volatility:.2f}%。"
        volatility_risk = "高波动会放大持仓体验，适合降低单次买入金额。"
    elif abs(day) >= 3 or volatility >= 10:
        volatility_conclusion = "波动中等"
        volatility_reason = f"今日 {format_change(day)}，近期振幅约 {volatility:.2f}%。"
        volatility_risk = "需要关注回撤时是否跌破近期支撑。"
    else:
        volatility_conclusion = "波动可控"
        volatility_reason = f"今日 {format_change(day)}，短线波动暂未异常放大。"
        volatility_risk = "低波动不等于低风险，仍要看趋势和消息面。"
    add_rule("波动", volatility_score, volatility_conclusion, volatility_reason, volatility_risk, model_weights["volatility"])

    data_score = 35 + (25 if data_coverage.get("quote") else 0) + (25 if data_coverage.get("history") else 0) + (15 if stock.get("quoteStats", {}).get("marketCap") else 0)
    data_conclusion = "数据较完整" if data_score >= 75 else "数据仍需补充"
    data_reason = "已结合实时行情、历史K线和部分基础字段。" if data_score >= 75 else "目前部分历史、估值或市值字段还不完整。"
    data_risk = "数据越少，建议越应偏保守。" if data_score < 75 else "免费行情源仍可能存在延迟或字段缺失。"
    add_rule("数据", data_score, data_conclusion, data_reason, data_risk, model_weights["data"])

    news_positive = int(news_counts.get("positive", 0) or 0)
    news_negative = int(news_counts.get("negative", 0) or 0)
    news_score = 55 + news_positive * 8 - news_negative * 10
    if news_positive > news_negative:
        news_conclusion = "消息偏积极"
        news_reason = "近期新闻里积极信号更多，适合提高跟踪优先级。"
        news_risk = "新闻利好兑现后，价格可能提前反映。"
    elif news_negative > news_positive:
        news_conclusion = "消息偏谨慎"
        news_reason = "近期负面或风险类消息更多，需要降低仓位冲动。"
        news_risk = "消息面若继续恶化，会压制估值修复。"
    elif news_impact.get("items"):
        news_conclusion = "消息中性"
        news_reason = "近期消息没有明显单边方向。"
        news_risk = "中性消息也可能在财报或公告后改变判断。"
    else:
        news_conclusion = "消息待补充"
        news_reason = "暂未读取到足够新闻样本。"
        news_risk = "缺少消息面时，不适合只看价格做决定。"
    add_rule("消息", news_score, news_conclusion, news_reason, news_risk, model_weights["news"])

    forecast_score = 42 + (forecast_probability - 50) * 0.85 + (forecast_risk_score - 50) * 0.35 + (forecast_confidence - 50) * 0.18
    if forecast_probability >= 64 and forecast_risk_score >= 55:
        forecast_conclusion = "模型偏积极"
        forecast_reason = f"20日偏强概率 {forecast_probability:.0f}%，波动安全分 {forecast_risk_score:.0f}。"
        forecast_risk = "模型偏强也需要等待价格确认，避免在单日大涨后追高。"
    elif forecast_probability <= 44 or forecast_risk_score <= 42:
        forecast_conclusion = "模型偏谨慎"
        forecast_reason = f"20日偏强概率 {forecast_probability:.0f}%，风险分 {forecast_risk_score:.0f}。"
        forecast_risk = "概率和风险分不支持加仓，先等趋势修复。"
    else:
        forecast_conclusion = "模型中性"
        forecast_reason = f"20日偏强概率 {forecast_probability:.0f}%，暂未形成单边信号。"
        forecast_risk = "中性阶段更适合分批观察，不适合一次性重仓。"
    add_rule("预测", forecast_score, forecast_conclusion, forecast_reason, forecast_risk, model_weights["forecast"])

    if holding:
        profit_score = 58 + total_gain_rate * 1.1
        if total_gain_rate >= 18:
            profit_conclusion = "盈利较多"
            profit_reason = f"当前累计收益 {format_change(total_gain_rate)}，已有较厚安全垫。"
            profit_risk = "盈利股也要防止回撤吞噬收益，可考虑分批锁定。"
        elif total_gain_rate <= -12:
            profit_conclusion = "亏损较深"
            profit_reason = f"当前累计收益 {format_change(total_gain_rate)}，已经进入明显亏损区。"
            profit_risk = "不要因为亏损扩大而机械补仓，先确认趋势是否修复。"
        elif total_gain_rate < 0:
            profit_conclusion = "轻度亏损"
            profit_reason = f"当前累计收益 {format_change(total_gain_rate)}，仍可观察支撑。"
            profit_risk = "若跌破近期低点，需要重新评估持仓理由。"
        else:
            profit_conclusion = "盈亏温和"
            profit_reason = f"当前累计收益 {format_change(total_gain_rate)}，持仓压力不算极端。"
            profit_risk = "收益不高时，加仓应更多依赖趋势和基本面。"
        add_rule("盈亏", profit_score, profit_conclusion, profit_reason, profit_risk, 0.14)

        position_limit = float(risk_profile["positionLimit"])
        heavy_position = float(risk_profile["heavyPosition"])
        position_score = 82 - max(0, position_ratio - position_limit) * 2.2
        if position_ratio >= heavy_position:
            position_conclusion = "仓位偏重"
            position_reason = f"该股占组合 {position_ratio:.1f}%，对组合影响较大。"
            position_risk = "单只股票仓位过高会放大非系统性风险。"
        elif position_ratio >= position_limit:
            position_conclusion = "仓位适中偏高"
            position_reason = f"该股占组合 {position_ratio:.1f}%，对{risk_profile['label']}型用户来说需要持续跟踪。"
            position_risk = "继续加仓前应确认行业和趋势都支持。"
        else:
            position_conclusion = "仓位可控"
            position_reason = f"该股占组合 {position_ratio:.1f}%，符合{risk_profile['label']}型用户的仓位边界。"
            position_risk = "仓位低也不代表可以忽略基本面风险。"
        add_rule("仓位", position_score, position_conclusion, position_reason, position_risk, 0.14)

    if concentration_ratio is not None:
        concentration_score = 88 - max(0, concentration_ratio - 35) * 1.4
        if concentration_ratio >= 60:
            concentration_conclusion = "行业集中度高"
            concentration_reason = f"所属方向在组合中约占 {concentration_ratio:.0f}%，行业变化会明显影响组合。"
            concentration_risk = "新增资金不宜继续集中到同一行业。"
        elif concentration_ratio >= 40:
            concentration_conclusion = "行业略集中"
            concentration_reason = f"所属方向在组合中约占 {concentration_ratio:.0f}%，需要适度分散。"
            concentration_risk = "行业政策或景气变化会带来联动波动。"
        else:
            concentration_conclusion = "行业分散度尚可"
            concentration_reason = f"所属方向占比约 {concentration_ratio:.0f}%，暂未过度拥挤。"
            concentration_risk = "仍需观察组合中其他高相关股票。"
        add_rule("行业集中度", concentration_score, concentration_conclusion, concentration_reason, concentration_risk, 0.1)

    weighted_score = sum(rule["score"] * rule["weight"] for rule in rules)
    weight_total = sum(rule["weight"] for rule in rules) or 1
    total = clamp_score(weighted_score / weight_total + float(risk_profile["scoreOffset"]))
    blocking_risk = any(rule["score"] < 38 for rule in rules if rule["name"] in {"趋势", "波动", "盈亏", "仓位"})
    if total >= 72 and not blocking_risk:
        stance = "建议继续持仓观察"
    elif total >= 62:
        stance = "可以轻仓或正常观察"
    elif total >= 48:
        stance = "暂不建议重仓持有"
    else:
        stance = "建议控制仓位"
    if data_quality["score"] < 55:
        stance = "数据不足，先观察"

    next_actions: list[str] = []
    triggers: list[dict[str, str]] = []
    target_position = risk_profile["normalTarget"]
    action_code = "watch"
    action_label = "先观察"
    action_reason = "趋势和风险信号还不够一致。"
    if data_quality["score"] < 55:
        action_code = "data_wait"
        action_label = "暂不生成明确建议"
        action_reason = "实时行情、历史K线或基本面字段不足，建议先补充数据。"
        next_actions.append("先等待行情和K线数据补齐，再判断是否持有或加仓。")
    if holding:
        if action_code == "data_wait":
            target_position = risk_profile["normalTarget"]
        elif position_ratio >= float(risk_profile["heavyPosition"]) and (forecast_probability < 55 or total_gain_rate < 0):
            action_code = "reduce"
            action_label = "降低仓位"
            action_reason = "单股仓位偏高，且预测或盈亏没有给出足够安全边际。"
            target_position = risk_profile["normalTarget"]
            next_actions.append("先把单只股票对组合的影响降下来。")
        elif total_gain_rate <= -12 and forecast_probability < 52:
            action_code = "reduce"
            action_label = "止损式减仓"
            action_reason = "亏损较深且模型没有明显修复信号。"
            target_position = "0%-10%" if risk_profile["label"] == "稳健" else "0%-15%"
            next_actions.append("不要用补仓摊低成本代替重新判断。")
        elif forecast_probability >= 62 and forecast_risk_score >= 55 and position_ratio <= float(risk_profile["positionLimit"]) and total_gain_rate > -8:
            action_code = "hold_or_add"
            action_label = "继续持有"
            action_reason = "模型偏强、仓位不重，适合继续跟踪。"
            target_position = risk_profile["maxTarget"]
            next_actions.append("若回调不破支撑，可考虑小额分批。")
        elif total >= 62 and position_ratio <= float(risk_profile["heavyPosition"]):
            action_code = "hold"
            action_label = "正常持有"
            action_reason = "持仓风险暂未明显失衡，继续看趋势确认。"
            target_position = risk_profile["maxTarget"]
            next_actions.append("保持仓位，等趋势或基本面更明确。")
        elif forecast_probability < 48 or forecast_risk_score < 45:
            action_code = "no_add"
            action_label = "暂不加仓"
            action_reason = "预测概率或波动安全分偏弱。"
            target_position = risk_profile["normalTarget"]
            next_actions.append("先观察价格能否重新站稳短期均线。")
        else:
            next_actions.append("先维持现有仓位，不急着加仓。")

        if total_gain_rate >= 15:
            next_actions.append("已有盈利垫，可设置分批止盈线。")
        elif total_gain_rate <= -8:
            next_actions.append("亏损扩大时优先复盘买入理由。")
        if position_ratio >= float(risk_profile["heavyPosition"]):
            next_actions.append("新增资金尽量不要继续集中到这一只。")
    else:
        if action_code == "data_wait":
            pass
        elif forecast_probability >= 62 and forecast_risk_score >= 55:
            action_code = "watch_buy"
            action_label = "可加入观察"
            action_reason = "预测偏强但还需要价格确认。"
            next_actions.append("等待回调不破支撑或放量突破后再考虑。")
        elif forecast_probability <= 44:
            action_code = "avoid"
            action_label = "暂不买入"
            action_reason = "模型偏谨慎，先等趋势修复。"
            next_actions.append("不因为短线反弹就急着建仓。")

    if not next_actions:
        next_actions.append("继续跟踪趋势、公告和成交变化。")
    if forecast.get("keyLevels"):
        levels = forecast.get("keyLevels") or {}
        support = levels.get("support")
        resistance = levels.get("resistance")
        if support:
            triggers.append({"name": "风险触发", "text": f"跌破短期支撑 {support} 后重新评估。"})
        if resistance:
            triggers.append({"name": "改善触发", "text": f"有效突破压力 {resistance} 后提高跟踪优先级。"})
    if day >= 5:
        triggers.append({"name": "追高提醒", "text": "单日涨幅较高时，不建议直接追买。"})

    primary_reasons = sorted(rules, key=lambda item: item["score"], reverse=True)[:2]
    primary_risks = sorted(rules, key=lambda item: item["score"])[:2]
    return {
        "version": ADVICE_MODEL_VERSION,
        "dataGuard": {
            "enabled": data_quality["score"] < 55,
            "score": data_quality["score"],
            "label": data_quality["label"],
            "warnings": data_quality["warnings"],
        },
        "total": total,
        "stance": stance,
        "action": {
            "code": action_code,
            "label": action_label,
            "reason": action_reason,
            "targetPosition": target_position,
        },
        "riskProfile": {
            "level": risk_profile["label"],
            "tone": risk_profile["tone"],
            "positionLimit": risk_profile["positionLimit"],
            "heavyPosition": risk_profile["heavyPosition"],
        },
        "industryModel": {
            "name": industry_model["name"],
            "focus": industry_model["focus"],
            "weights": model_weights,
        },
        "nextActions": next_actions[:3],
        "triggers": triggers[:3],
        "holdingContext": {
            "positionRatio": round(position_ratio, 2),
            "totalGainRate": round(total_gain_rate, 2),
            "currentPrice": current_price,
            "forecastProbability20d": round(forecast_probability, 2),
            "forecastRiskScore": round(forecast_risk_score, 2),
        },
        "rules": rules,
        "summary": "；".join(rule["conclusion"] for rule in primary_reasons),
        "risk": "；".join(rule["risk"] for rule in primary_risks),
        "trendView": next((rule["reason"] for rule in rules if rule["name"] == "趋势"), ""),
        "systemAnalysis": f"{stock['name']}当前综合评分 {total}，{stance}。核心依据：{'；'.join(rule['reason'] for rule in primary_reasons)}",
        "updated": now_text(),
        "price": current_price,
    }


def score_stock_analysis(stock: dict[str, Any]) -> dict[str, Any]:
    performance = stock.get("performance", {})
    day = float(performance.get("day", 0) or 0)
    week = float(performance.get("week", 0) or 0)
    month = float(performance.get("month", 0) or 0)
    score = float(stock.get("score", 60) or 60)
    has_history = bool(stock.get("dataCoverage", {}).get("history"))
    has_quote = bool(stock.get("dataCoverage", {}).get("quote"))
    has_market_cap = bool(stock.get("quoteStats", {}).get("marketCap"))
    volatility = abs(day) * 4 + abs(week) * 1.5

    momentum_score = clamp_score(50 + day * 2.6 + week * 1.8 + month * 1.2)
    trend_score = clamp_score(50 + month * 2.4 + week * 1.4)
    risk_score = clamp_score(88 - volatility)
    data_score = clamp_score(35 + (25 if has_quote else 0) + (25 if has_history else 0) + (15 if has_market_cap else 0))
    industry_score = clamp_score(score)
    total_score = clamp_score(momentum_score * 0.28 + trend_score * 0.26 + risk_score * 0.2 + data_score * 0.14 + industry_score * 0.12)

    if total_score >= 72 and risk_score >= 55:
        stance = "继续持仓观察"
    elif total_score >= 58:
        stance = "轻仓观察"
    elif risk_score < 45:
        stance = "控制仓位"
    else:
        stance = "先观察"

    reasons = []
    if momentum_score >= 65:
        reasons.append("短期动量较强")
    elif momentum_score <= 40:
        reasons.append("短期动量偏弱")
    if trend_score >= 65:
        reasons.append("近一月趋势改善")
    elif trend_score <= 40:
        reasons.append("近一月趋势承压")
    if risk_score <= 45:
        reasons.append("波动风险偏高")
    if data_score < 65:
        reasons.append("数据覆盖仍需补充")
    if not reasons:
        reasons.append("当前信号中性，适合继续跟踪")

    data_quality = stock_data_quality(stock)
    advice_engine = build_stock_advice_engine(stock)
    forecast = build_stock_forecast(stock)
    analysis = {
        "modelVersion": ADVICE_MODEL_VERSION,
        "total": total_score,
        "stance": advice_engine["stance"] if advice_engine else stance,
        "reasons": reasons[:3],
        "factors": [
            {"name": "短期动量", "score": momentum_score, "text": f"今日 {format_change(day)}，近一周 {format_change(week)}。"},
            {"name": "趋势质量", "score": trend_score, "text": f"近一月 {format_change(month)}，用于判断是否形成持续方向。"},
            {"name": "波动风险", "score": risk_score, "text": "分数越低代表短期波动越大，仓位需要更谨慎。"},
            {"name": "数据完整度", "score": data_score, "text": "结合实时价、历史K线和市值字段覆盖情况。"},
            {"name": "研究基础", "score": industry_score, "text": "来自当前股票基础评分和行业标签。"},
        ],
        "advice": advice_engine,
        "forecast": forecast,
        "dataQuality": data_quality,
        "sourceTrust": data_quality.get("sourceTrust"),
        "compliance": compliance_disclosure(forecast.get("confidence", {}).get("label")),
        "industryModel": advice_engine.get("industryModel"),
    }
    return analysis


def apply_analysis_score(stock: dict[str, Any]) -> dict[str, Any]:
    stock = {**stock}
    analysis = score_stock_analysis(stock)
    stock["analysisScore"] = analysis
    stock["score"] = analysis["total"]
    return stock


def classify_news(title: str, content: str = "") -> tuple[str, str, str]:
    text = f"{title} {content}"
    positive_words = ["增长", "上涨", "盈利", "中标", "签约", "回购", "增持", "分红", "获批", "投产", "突破", "创新高"]
    negative_words = ["亏损", "下滑", "下降", "减持", "处罚", "诉讼", "预亏", "风险", "违约", "退市", "问询", "调查"]
    watch_words = ["董事长", "总裁", "选举", "聘任", "公告", "会议", "变更", "质押", "解禁", "融资"]

    if any(word in text for word in negative_words):
        return "利空", "down", "可能压制短期情绪，需要确认影响范围和持续时间。"
    if any(word in text for word in positive_words):
        return "利好", "up", "可能改善市场关注度，但仍需结合业绩和价格位置。"
    if any(word in text for word in watch_words):
        return "待观察", "neutral", "属于需要跟踪的公司事件，短期影响取决于后续公告。"
    return "待观察", "neutral", "信息影响暂不明确，先作为观察变量记录。"


def fetch_stock_news_impact(code: str, limit: int = 5) -> dict[str, Any]:
    clean = clean_code(code)
    stock = get_stock_or_404(clean)
    items: list[dict[str, Any]] = []
    errors: list[str] = []

    try:
        import akshare as ak

        news_df = ak.stock_news_em(symbol=clean)
        for _, row in news_df.head(limit).iterrows():
            title = str(value_from_row(row, ["新闻标题"], ""))
            content = str(value_from_row(row, ["新闻内容"], ""))
            category, tone, summary = classify_news(title, content)
            items.append(
                {
                    "title": title,
                    "category": category,
                    "tone": tone,
                    "summary": summary,
                    "publishedAt": str(value_from_row(row, ["发布时间"], "")),
                    "source": str(value_from_row(row, ["文章来源"], "")),
                    "url": str(value_from_row(row, ["新闻链接"], "")),
                }
            )
    except Exception as error:
        errors.append(f"stock-news:{type(error).__name__}")

    counts = {
        "positive": sum(1 for item in items if item["tone"] == "up"),
        "negative": sum(1 for item in items if item["tone"] == "down"),
        "watch": sum(1 for item in items if item["tone"] == "neutral"),
    }
    if counts["positive"] > counts["negative"]:
        stance = "消息面偏积极"
    elif counts["negative"] > counts["positive"]:
        stance = "消息面偏谨慎"
    elif items:
        stance = "消息面待观察"
    else:
        stance = "暂未读取到新闻"

    impact = {
        "stance": stance,
        "items": items,
        "counts": counts,
        "updated": now_text(),
        "errors": errors,
    }
    stock["newsImpact"] = impact
    upsert_stock(stock)
    return impact


def cached_stock_news_impact(code: str, limit: int = 5, max_age_minutes: int = NEWS_CACHE_MINUTES) -> dict[str, Any]:
    clean = clean_code(code)
    with connect() as db:
        row = db.execute("SELECT payload, updated_at FROM news_cache WHERE code = ?", (clean,)).fetchone()
    if row and not timestamp_is_stale(row["updated_at"], max_age_minutes):
        payload = from_json(row["payload"])
        return {**payload, "cache": {"mode": "cached", "updatedAt": row["updated_at"]}}
    impact = fetch_stock_news_impact(clean, limit=limit)
    with connect() as db:
        db.execute(
            """
            INSERT INTO news_cache (code, payload, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET
              payload = excluded.payload,
              updated_at = excluded.updated_at
            """,
            (clean, to_json(impact), now_text()),
        )
    return {**impact, "cache": {"mode": "fresh", "updatedAt": now_text()}}


def refresh_user_news_cache(user_id: str | None = None) -> dict[str, Any]:
    owner_id = user_id or current_user_id()
    with connect() as db:
        rows = db.execute(
            """
            SELECT code FROM watchlist WHERE user_id = ?
            UNION
            SELECT code FROM portfolio WHERE user_id = ?
            """,
            (owner_id, owner_id),
        ).fetchall()
    codes = [row["code"] for row in rows]
    refreshed = 0
    errors: list[str] = []
    for code in codes[:20]:
        try:
            cached_stock_news_impact(code, limit=5, max_age_minutes=0)
            refreshed += 1
        except Exception as error:
            errors.append(f"{code}:{type(error).__name__}")
    return {
        "userId": owner_id,
        "refreshed": refreshed,
        "codes": codes[:20],
        "errors": errors[:5],
        "updatedAt": now_text(),
    }


def latest_news_item(stock: dict[str, Any]) -> dict[str, Any] | None:
    impact = stock.get("newsImpact") or {}
    items = impact.get("items") or []
    return items[0] if items else None


def recent_high_breakout(stock: dict[str, Any]) -> tuple[bool, float | None]:
    rows = stock.get("klineRows") or []
    if len(rows) < 10:
        return False, None
    recent_rows = rows[-11:-1] if len(rows) >= 11 else rows[:-1]
    current = number_or_none(rows[-1].get("close"))
    high = max(
        (
            number_or_none(row.get("high")) or number_or_none(row.get("close")) or 0
            for row in recent_rows
        ),
        default=0,
    )
    if current is None or high <= 0:
        return False, high or None
    return current >= high, high


def alert_severity_for_tone(tone: str | None) -> str:
    if tone == "up":
        return "positive"
    if tone == "down":
        return "warning"
    return "neutral"


def alert_event_id(stock: dict[str, Any], event_type: str, seed: str = "") -> str:
    day_key = datetime.now().strftime("%Y%m%d")
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()[:10] if seed else day_key
    return f"{stock['code']}-{event_type}-{digest}"


def save_alert_events(events: list[dict[str, Any]], user_id: str | None = None) -> None:
    if not events:
        return
    owner_id = user_id or current_user_id()
    with connect() as db:
        db.executemany(
            """
            INSERT OR IGNORE INTO alert_events
              (id, user_id, code, event_type, severity, title, text, payload, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    event["id"],
                    owner_id,
                    event["code"],
                    event["type"],
                    event["severity"],
                    event["title"],
                    event["text"],
                    to_json(event),
                    event.get("createdAt") or now_text(),
                )
                for event in events
            ],
        )


def insert_alert_event(db: sqlite3.Connection, event: dict[str, Any], user_id: str | None = None) -> None:
    owner_id = user_id or current_user_id()
    db.execute(
        """
        INSERT OR IGNORE INTO alert_events
          (id, user_id, code, event_type, severity, title, text, payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            event["id"],
            owner_id,
            event["code"],
            event["type"],
            event["severity"],
            event["title"],
            event["text"],
            to_json(event),
            event.get("createdAt") or now_text(),
        ),
    )


def severity_for_advice_action(action_code: str | None) -> str:
    if action_code in {"reduce", "no_add", "avoid"}:
        return "warning"
    if action_code in {"hold", "hold_or_add", "watch_buy"}:
        return "positive"
    return "neutral"


def build_advice_change_alert_event(
    *,
    item: dict[str, Any],
    previous_action: str,
    next_action: str,
    snapshot_id: str,
) -> dict[str, Any]:
    engine = item.get("adviceEngine") or {}
    action = engine.get("action") or {}
    clean = clean_code(str(item.get("code") or ""))
    seed = f"{snapshot_id}:{previous_action}:{next_action}"
    return {
        "id": f"{clean}-advice-change-{hashlib.sha1(seed.encode('utf-8')).hexdigest()[:10]}",
        "code": clean,
        "name": item.get("name") or clean,
        "type": "advice-change",
        "severity": severity_for_advice_action(action.get("code")),
        "title": f"{item.get('name') or clean} 建议变化",
        "text": f"系统建议从“{previous_action}”变为“{next_action}”。{action.get('reason') or '建议查看持仓和风险原因。'}",
        "createdAt": now_text(),
        "payload": {
            "previousAction": previous_action,
            "nextAction": next_action,
            "score": engine.get("total"),
            "positionRatio": item.get("positionRatio"),
            "totalGainRate": item.get("totalGainRate"),
            "snapshotId": snapshot_id,
        },
    }


def list_alert_events(limit: int = 20, user_id: str | None = None) -> list[dict[str, Any]]:
    owner_id = user_id or current_user_id()
    with connect() as db:
        rows = db.execute(
            """
            SELECT id, payload, read_at
            FROM alert_events
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (owner_id, limit),
        ).fetchall()
    events = []
    for row in rows:
        event = from_json(row["payload"])
        event["id"] = row["id"]
        event["read"] = bool(row["read_at"])
        events.append(event)
    return events


def unread_alert_count(user_id: str | None = None) -> int:
    owner_id = user_id or current_user_id()
    with connect() as db:
        row = db.execute(
            "SELECT COUNT(*) AS count FROM alert_events WHERE user_id = ? AND read_at IS NULL",
            (owner_id,),
        ).fetchone()
    return int(row["count"] if row else 0)


def mark_alert_events_read(event_id: str | None = None, user_id: str | None = None) -> dict[str, Any]:
    owner_id = user_id or current_user_id()
    with connect() as db:
        if event_id:
            db.execute(
                "UPDATE alert_events SET read_at = COALESCE(read_at, ?) WHERE id = ? AND user_id = ?",
                (now_text(), event_id, owner_id),
            )
        else:
            db.execute(
                "UPDATE alert_events SET read_at = COALESCE(read_at, ?) WHERE user_id = ? AND read_at IS NULL",
                (now_text(), owner_id),
            )
    return {
        "events": list_alert_events(user_id=owner_id),
        "unreadCount": unread_alert_count(owner_id),
    }


def save_alert_monitor_status(status: dict[str, Any]) -> dict[str, Any]:
    with connect() as db:
        db.execute(
            """
            INSERT INTO app_settings (key, payload)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET payload = excluded.payload
            """,
            ("alert_monitor_status", to_json(status)),
        )
    return status


def get_alert_monitor_status() -> dict[str, Any]:
    with connect() as db:
        row = db.execute("SELECT payload FROM app_settings WHERE key = ?", ("alert_monitor_status",)).fetchone()
    if not row:
        return {
            "running": False,
            "lastCheck": None,
            "lastEventCount": 0,
            "message": "提醒检查尚未运行。",
        }
    return from_json(row["payload"])


def save_task_status(task_id: str, status: dict[str, Any]) -> dict[str, Any]:
    payload = {**status, "taskId": task_id, "updatedAt": now_text()}
    with connect() as db:
        db.execute(
            """
            INSERT INTO app_settings (key, payload)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET payload = excluded.payload
            """,
            (f"task_status:{task_id}", to_json(payload)),
        )
    return payload


def record_task_run(task_id: str, source: str, status: str, duration_ms: int, payload: dict[str, Any], error: str | None = None) -> None:
    with connect() as db:
        db.execute(
            """
            INSERT INTO task_runs (id, task_id, source, status, duration_ms, error, payload, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """,
            (secrets.token_hex(12), task_id, source, status, duration_ms, error, to_json(payload)),
        )


def task_run_health(task_id: str) -> dict[str, Any]:
    with connect() as db:
        rows = db.execute(
            """
            SELECT status, error, duration_ms, created_at
            FROM task_runs
            WHERE task_id = ?
            ORDER BY created_at DESC
            LIMIT 8
            """,
            (task_id,),
        ).fetchall()
    failure_count = 0
    for row in rows:
        if row["status"] == "ok":
            break
        failure_count += 1
    last = rows[0] if rows else None
    return {
        "recentRuns": len(rows),
        "consecutiveFailures": failure_count,
        "lastStatus": last["status"] if last else "waiting",
        "lastError": last["error"] if last else None,
        "lastDurationMs": last["duration_ms"] if last else None,
    }


def get_task_status(task_id: str) -> dict[str, Any]:
    with connect() as db:
        row = db.execute("SELECT payload FROM app_settings WHERE key = ?", (f"task_status:{task_id}",)).fetchone()
    if row:
        return {**from_json(row["payload"]), "health": task_run_health(task_id)}
    config = BACKGROUND_TASKS[task_id]
    return {
        "taskId": task_id,
        "label": config["label"],
        "intervalMinutes": config["intervalMinutes"],
        "lastRun": None,
        "nextRun": None,
        "lastResult": None,
        "lastError": None,
        "updatedAt": None,
        "health": task_run_health(task_id),
    }


def list_task_statuses() -> dict[str, Any]:
    settings = alert_settings_show()
    return {
        "tickSeconds": BACKGROUND_TASK_TICK_SECONDS,
        "automation": {
            "enabled": bool(settings.get("enabled")),
            "alertIntervalMinutes": int(settings.get("checkIntervalMinutes") or ALERT_CHECK_INTERVAL_MINUTES),
            "message": "后台会按间隔检查观察池、持仓行情和建议变化。",
        },
        "tasks": [get_task_status(task_id) for task_id in BACKGROUND_TASKS],
    }


def task_is_due(task_id: str) -> bool:
    status = get_task_status(task_id)
    config = BACKGROUND_TASKS[task_id]
    if task_id == "alert_check":
        settings = alert_settings_show()
        config = {**config, "intervalMinutes": int(settings.get("checkIntervalMinutes") or config["intervalMinutes"])}
    last_run = parse_refresh_time(status.get("lastRun"))
    if last_run is None:
        return True
    return datetime.now() - last_run >= timedelta(minutes=config["intervalMinutes"])


def next_run_text(interval_minutes: int) -> str:
    return (datetime.now() + timedelta(minutes=interval_minutes)).strftime("%Y-%m-%d %H:%M:%S")


def run_background_task(task_id: str, source: str = "background") -> dict[str, Any]:
    started = time.time()
    config = BACKGROUND_TASKS[task_id]
    try:
        if task_id == "portfolio_quotes":
            codes = list_portfolio_codes()
            result = refresh_cached_quotes(codes)
        elif task_id == "watchlist_quotes":
            codes = list_watchlist_codes()
            result = refresh_cached_quotes(codes)
        elif task_id == "news_cache":
            result = refresh_user_news_cache()
        elif task_id == "alert_check":
            result = run_alert_check(source)
        elif task_id == "stock_directory":
            result = refresh_stock_directory(force=True)
        elif task_id == "market_universe":
            result = ensure_market_universe()
        else:
            raise RuntimeError(f"UNKNOWN_TASK:{task_id}")

        duration_ms = round((time.time() - started) * 1000)
        status = save_task_status(
            task_id,
            {
                "label": config["label"],
                "intervalMinutes": config["intervalMinutes"],
                "source": source,
                "lastRun": now_text(),
                "nextRun": next_run_text(config["intervalMinutes"]),
                "durationMs": duration_ms,
                "lastResult": result,
                "lastError": None,
            },
        )
        record_task_run(task_id, source, "ok", duration_ms, result)
        return status
    except Exception as error:
        duration_ms = round((time.time() - started) * 1000)
        error_payload = {"error": type(error).__name__}
        status = save_task_status(
            task_id,
            {
                "label": config["label"],
                "intervalMinutes": config["intervalMinutes"],
                "source": source,
                "lastRun": now_text(),
                "nextRun": next_run_text(config["intervalMinutes"]),
                "durationMs": duration_ms,
                "lastResult": None,
                "lastError": type(error).__name__,
            },
        )
        record_task_run(task_id, source, "error", duration_ms, error_payload, type(error).__name__)
        raise RuntimeError(f"{task_id}:{type(error).__name__}") from error


async def background_task_loop() -> None:
    await asyncio.sleep(3)
    while True:
        for task_id in BACKGROUND_TASKS:
            if task_is_due(task_id):
                with suppress(Exception):
                    await asyncio.to_thread(run_background_task, task_id, "background")
        await asyncio.sleep(BACKGROUND_TASK_TICK_SECONDS)


def run_alert_check(source: str = "manual") -> dict[str, Any]:
    settings = alert_settings_show()
    if not settings.get("enabled"):
        status = {
            "running": False,
            "source": source,
            "lastCheck": now_text(),
            "lastEventCount": 0,
            "message": "观察池通知已关闭。",
        }
        save_alert_monitor_status(status)
        return {"status": status, "events": []}

    try:
        events = build_alert_events()
        save_alert_events(events)
        status = {
            "running": True,
            "source": source,
            "lastCheck": now_text(),
            "lastEventCount": len(events),
            "message": "提醒检查已完成。",
        }
        save_alert_monitor_status(status)
        return {"status": status, "events": list_alert_events()}
    except Exception as error:
        status = {
            "running": True,
            "source": source,
            "lastCheck": now_text(),
            "lastEventCount": 0,
            "message": "提醒检查失败，稍后会自动重试。",
            "errors": [type(error).__name__],
        }
        save_alert_monitor_status(status)
        raise


def build_alert_events() -> list[dict[str, Any]]:
    settings = alert_settings_show()
    if not settings.get("enabled"):
        return []

    enabled_rules = set(settings.get("rules") or [])
    events: list[dict[str, Any]] = []

    for stock in watchlist_index():
        stock = apply_snapshot_history(stock)
        day_move = number_or_none(stock.get("performance", {}).get("day"))

        if "单日涨跌幅超过 3%" in enabled_rules and day_move is not None and abs(day_move) >= 3:
            events.append(
                {
                    "id": alert_event_id(stock, "price-move"),
                    "code": stock["code"],
                    "name": stock["name"],
                    "type": "price-move",
                    "severity": "positive" if day_move > 0 else "warning",
                    "title": f"{stock['name']} 单日波动较大",
                    "text": f"今日涨跌 {format_change(day_move)}，已超过 3%，建议回看仓位和触发原因。",
                    "createdAt": now_text(),
                }
            )

        if "价格突破近 10 日高点" in enabled_rules:
            try:
                if not stock.get("klineRows"):
                    stock = refresh_eastmoney_history(stock["code"])
                is_breakout, recent_high = recent_high_breakout(stock)
                if is_breakout:
                    events.append(
                        {
                            "id": alert_event_id(stock, "breakout"),
                            "code": stock["code"],
                            "name": stock["name"],
                            "type": "breakout",
                            "severity": "positive",
                            "title": f"{stock['name']} 突破近 10 日高点",
                            "text": f"最新价格站上近 10 日高点 {recent_high:.2f}，可观察是否放量延续。",
                            "createdAt": now_text(),
                        }
                    )
            except Exception:
                pass

        if "出现公告或财报更新" in enabled_rules:
            try:
                impact = stock.get("newsImpact") or cached_stock_news_impact(stock["code"], limit=3)
                stock["newsImpact"] = impact
                item = latest_news_item(stock)
                if item:
                    events.append(
                        {
                            "id": alert_event_id(stock, "news", item.get("title", "")),
                            "code": stock["code"],
                            "name": stock["name"],
                            "type": "news",
                            "severity": alert_severity_for_tone(item.get("tone")),
                            "title": f"{stock['name']} 有新消息",
                            "text": f"{item.get('category', '待观察')}：{item.get('title', '')}",
                            "createdAt": impact.get("updated") or now_text(),
                        }
                    )
            except Exception:
                pass

        stock = apply_analysis_score(stock)
        advice = (stock.get("analysisScore") or {}).get("advice") or {}
        action = advice.get("action") or {}
        action_code = action.get("code")
        if "建议发生变化" in enabled_rules and action_code in {"reduce", "no_add", "avoid", "data_wait", "watch_buy"}:
            events.append(
                {
                    "id": alert_event_id(stock, "advice-signal", str(action_code)),
                    "code": stock["code"],
                    "name": stock["name"],
                    "type": "advice-change",
                    "severity": severity_for_advice_action(action_code),
                    "title": f"{stock['name']} 建议需要复核",
                    "text": f"当前建议：{action.get('label', advice.get('stance', '重新观察'))}。{action.get('reason', '建议重新查看分析。')}",
                    "createdAt": now_text(),
                }
            )
        if "跌破支撑或接近压力" in enabled_rules:
            forecast = (stock.get("analysisScore") or {}).get("forecast") or {}
            levels = forecast.get("keyLevels") or {}
            support = levels.get("support")
            resistance = levels.get("resistance")
            distance_to_support = levels.get("distanceToSupport")
            distance_to_resistance = levels.get("distanceToResistance")
            if support and distance_to_support is not None and distance_to_support <= 1.5:
                events.append(
                    {
                        "id": alert_event_id(stock, "support-risk", str(support)),
                        "code": stock["code"],
                        "name": stock["name"],
                        "type": "support-risk",
                        "severity": "warning",
                        "title": f"{stock['name']} 接近支撑位",
                        "text": f"价格距离短期支撑 {support} 较近，跌破后需要重新评估风险。",
                        "createdAt": now_text(),
                    }
                )
            if resistance and distance_to_resistance is not None and distance_to_resistance <= 2:
                events.append(
                    {
                        "id": alert_event_id(stock, "resistance-watch", str(resistance)),
                        "code": stock["code"],
                        "name": stock["name"],
                        "type": "resistance-watch",
                        "severity": "positive",
                        "title": f"{stock['name']} 接近压力位",
                        "text": f"价格距离短期压力 {resistance} 较近，若放量突破可提高关注优先级。",
                        "createdAt": now_text(),
                    }
                )
        upsert_stock(stock)

    severity_order = {"warning": 0, "positive": 1, "neutral": 2}
    return sorted(events, key=lambda item: severity_order.get(item["severity"], 9))[:20]


def stock_sector_names(stock: dict[str, Any]) -> list[str]:
    text = " ".join(
        [
            str(stock.get("name", "")),
            str(stock.get("industry", "")),
            " ".join(str(tag) for tag in stock.get("tags", [])),
        ]
    ).lower()
    matched = [
        name
        for name, keywords in INDUSTRY_BUCKETS
        if any(keyword.lower() in text for keyword in keywords)
    ]
    return matched or ([stock["industry"]] if stock.get("industry") and stock.get("industry") != "A股" else [])


def sector_strength_payload(stocks_for_market: list[dict[str, Any]], limit: int = 10) -> list[dict[str, Any]]:
    buckets: dict[str, dict[str, Any]] = {}
    for stock in stocks_for_market:
        day_move = number_or_none(stock.get("performance", {}).get("day"))
        if day_move is None:
            continue
        for sector_name in stock_sector_names(stock):
            bucket = buckets.setdefault(
                sector_name,
                {"name": sector_name, "moves": [], "leaders": []},
            )
            bucket["moves"].append(day_move)
            bucket["leaders"].append(stock)

    sectors = []
    for bucket in buckets.values():
        count = len(bucket["moves"])
        if count < 3:
            continue
        average_move = sum(bucket["moves"]) / count
        leaders = sorted(
            bucket["leaders"],
            key=lambda item: item.get("performance", {}).get("day", 0),
            reverse=average_move >= 0,
        )[:2]
        sectors.append(
            {
                "name": bucket["name"],
                "change": format_change(average_move),
                "tone": "up" if average_move >= 0 else "down",
                "count": count,
                "leaders": [
                    {"code": stock["code"], "name": stock["name"], "change": stock["change"]}
                    for stock in leaders
                ],
            }
        )

    if not sectors:
        return MARKET_OVERVIEW["sectors"]

    strong = sorted(
        [sector for sector in sectors if sector["tone"] == "up"],
        key=lambda sector: number_or_none(sector["change"].replace("%", "")) or 0,
        reverse=True,
    )[: max(1, limit // 2)]
    weak = sorted(
        [sector for sector in sectors if sector["tone"] == "down"],
        key=lambda sector: number_or_none(sector["change"].replace("%", "")) or 0,
    )[: max(1, limit - len(strong))]
    return (strong + weak)[:limit]


def market_overview_payload() -> dict[str, Any]:
    ensure_market_universe()
    all_stocks = [stock for stock in list_stocks() if stock.get("market") == "cn"]
    changed = [stock for stock in all_stocks if number_or_none(stock.get("performance", {}).get("day")) is not None]
    up_count = sum(1 for stock in changed if stock["performance"]["day"] > 0)
    down_count = sum(1 for stock in changed if stock["performance"]["day"] < 0)
    total = max(len(changed), 1)
    breadth = round(up_count / total * 100)
    mood = "偏强" if breadth >= 58 else "偏弱" if breadth <= 42 else "分化"
    status = get_data_status()
    refreshed_at = parse_refresh_time(status.get("lastRefresh"))
    overview = {
        **MARKET_OVERVIEW,
        "updated": refreshed_at.strftime("%H:%M") if refreshed_at else MARKET_OVERVIEW["updated"],
        "breadth": breadth,
        "mood": mood,
        "summary": f"A股缓存股票 {len(all_stocks)} 只，上涨 {up_count} 只，下跌 {down_count} 只。首页推荐每 {MARKET_REFRESH_MINUTES} 分钟按最新行情重算。",
        "refreshIntervalMinutes": MARKET_REFRESH_MINUTES,
        "dataSource": status.get("source", "cache"),
        "sectors": sector_strength_payload(all_stocks),
        "globalMarkets": [
            {
                "id": "cn",
                "name": "A股",
                "mood": mood,
                "metric": "上涨占比",
                "value": f"{breadth}%",
                "change": MARKET_OVERVIEW["indices"][2]["change"],
                "source": "实时监看",
            },
            {
                "id": "hk",
                "name": "港股",
                "mood": "分化",
                "metric": "上涨占比",
                "value": "49%",
                "change": "-0.28%",
                "source": "监看位",
            },
            {
                "id": "us",
                "name": "美股",
                "mood": "温和",
                "metric": "上涨占比",
                "value": "58%",
                "change": "+0.41%",
                "source": "监看位",
            },
        ],
    }
    overview["marketDetails"] = {
        **MARKET_OVERVIEW["marketDetails"],
        "cn": {
            "name": "A股",
            "summary": overview["summary"],
            "indices": MARKET_OVERVIEW["indices"],
            "sectors": overview["sectors"],
        },
    }
    return overview


def today_recommendation_payload(limit: int = 12) -> list[dict[str, Any]]:
    ensure_market_universe()
    feedback = recommendation_feedback_summary()
    candidates = [
        stock
        for stock in list_stocks()
        if stock.get("market") == "cn" and stock_price_number(stock) > 0
    ]
    ranked = sorted(candidates, key=lambda stock: personalized_recommendation_score(stock, feedback), reverse=True)
    result: list[dict[str, Any]] = []
    for stock in ranked[:limit]:
        quality = stock_data_quality(stock)
        industry = stock.get("industry") or ""
        reason = "按市场强度和趋势排序"
        if feedback["codeScores"].get(stock["code"], 0) > 0:
            reason = "你最近关注过这只股票"
        elif feedback["industryScores"].get(industry, 0) > 0:
            reason = f"你最近更关注{industry}方向"
        item = {
            **stock,
            "recommendation": {
                "modelVersion": RECOMMENDATION_MODEL_VERSION,
                "personalizedScore": round(personalized_recommendation_score(stock, feedback), 2),
                "reason": reason,
                "dataQuality": {
                    "score": quality["score"],
                    "label": quality["label"],
                },
            },
        }
        result.append(item)
    return result


def search_stocks(keyword: str) -> list[dict[str, Any]]:
    raw_term = keyword.strip()
    code_term = clean_code(raw_term)
    normalized_term = raw_term.lower()
    if not raw_term:
        return list_curated_stocks()
    scored_matches = []
    for stock in list_stocks():
        code = stock["code"]
        name = stock["name"]
        industry = stock["industry"]
        name_lower = name.lower()
        industry_lower = industry.lower()
        initials = pinyin_initials(name)
        score = 0
        if code_term and code.startswith(code_term):
            score += 120
        elif code_term and code_term in code:
            score += 90
        if normalized_term == name_lower:
            score += 110
        elif name_lower.startswith(normalized_term):
            score += 90
        elif normalized_term in name_lower:
            score += 70
        if normalized_term and initials.startswith(normalized_term):
            score += 84
        elif normalized_term and normalized_term in initials:
            score += 58
        if normalized_term in industry_lower:
            score += 34
        if score:
            scored_matches.append((score + float(stock.get("score", 0)) / 100, stock))

    matches = [stock for _, stock in sorted(scored_matches, key=lambda item: item[0], reverse=True)]
    if len(matches) < 10:
        existing_codes = {stock["code"] for stock in matches}
        matches.extend(stock for stock in directory_matches(raw_term, 25) if stock["code"] not in existing_codes)
    return [apply_snapshot_history(stock) for stock in matches[:25]]


def update_stock_with_hist(stock: dict[str, Any], hist_df: Any) -> dict[str, Any]:
    if hist_df is None or hist_df.empty:
        return stock
    recent = hist_df.tail(10)
    closes = [float(value) for value in recent["收盘"].tolist()]
    if not closes:
        return stock
    spark_min = min(closes)
    spark_range = max(closes) - spark_min or 1
    sparkline = [round(40 + ((item - spark_min) / spark_range) * 22, 2) for item in closes]
    stock = {**stock}
    stock["chart"] = [round(item, 2) for item in closes]
    stock["sparkline"] = sparkline
    if len(closes) >= 5:
        week = (closes[-1] - closes[-5]) / closes[-5] * 100
        stock["performance"] = {**stock["performance"], "week": round(week, 2)}
    if len(closes) >= 10:
        month = (closes[-1] - closes[0]) / closes[0] * 100
        stock["performance"] = {**stock["performance"], "month": round(month, 2)}
    stock["dataCoverage"] = {**stock.get("dataCoverage", {}), "history": True}
    return stock


def tushare_query(api_name: str, params: dict[str, Any], fields: str) -> dict[str, Any]:
    token = get_tushare_token()
    if not token:
        raise RuntimeError("TUSHARE_TOKEN_MISSING")
    response = requests.post(
        "http://api.tushare.pro",
        json={
            "api_name": api_name,
            "token": token,
            "params": params,
            "fields": fields,
        },
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    if payload.get("code") != 0:
        raise RuntimeError(payload.get("msg") or f"Tushare error {payload.get('code')}")
    return payload["data"]


def rows_to_dicts(data: dict[str, Any]) -> list[dict[str, Any]]:
    fields = data.get("fields", [])
    return [dict(zip(fields, item)) for item in data.get("items", [])]


def refresh_tushare_history(code: str) -> dict[str, Any]:
    clean = clean_code(code)
    stock = get_stock_or_404(clean)
    end_date = datetime.now().strftime("%Y%m%d")
    start_date = (datetime.now() - timedelta(days=420)).strftime("%Y%m%d")
    data = tushare_query(
        "daily",
        {"ts_code": tushare_symbol(clean), "start_date": start_date, "end_date": end_date},
        "ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount",
    )
    rows = rows_to_dicts(data)
    if not rows:
        raise RuntimeError("TUSHARE_EMPTY_HISTORY")

    rows = sorted(rows, key=lambda row: row["trade_date"])
    recent = rows[-60:]
    closes = [float(row["close"]) for row in recent]
    last_row = recent[-1]
    ten = recent[-10:] if len(recent) >= 10 else recent
    spark_min = min(float(row["close"]) for row in ten)
    spark_range = max(float(row["close"]) for row in ten) - spark_min or 1

    stock = {**stock}
    stock["price"] = price_to_text(last_row["close"])
    stock["change"] = format_change(last_row["pct_chg"])
    stock["performance"] = {
        **stock["performance"],
        "day": round(float(last_row["pct_chg"]), 2),
        "week": round((closes[-1] - closes[-5]) / closes[-5] * 100, 2) if len(closes) >= 5 else 0,
        "month": round((closes[-1] - closes[-20]) / closes[-20] * 100, 2) if len(closes) >= 20 else 0,
    }
    stock["chart"] = [round(float(row["close"]), 2) for row in ten]
    stock["sparkline"] = [
        round(40 + ((float(row["close"]) - spark_min) / spark_range) * 22, 2)
        for row in ten
    ]
    stock["updated"] = f"日K {last_row['trade_date']}"
    stock["dataCoverage"] = {**stock.get("dataCoverage", {}), "quote": True, "history": True}
    stock["klineRows"] = [
        {
            "date": row["trade_date"],
            "open": round(float(row["open"]), 2),
            "close": round(float(row["close"]), 2),
            "high": round(float(row["high"]), 2),
            "low": round(float(row["low"]), 2),
            "volume": float(row["vol"]),
            "amount": float(row["amount"]),
            "pctChg": round(float(row["pct_chg"]), 2),
        }
        for row in ten
    ]
    stock["pulse"] = f"已补充历史日K，近一月走势 {format_change(stock['performance']['month'])}。"
    upsert_stock(stock)
    return stock


def refresh_eastmoney_history(code: str) -> dict[str, Any]:
    clean = clean_code(code)
    stock = get_stock_or_404(clean)
    params = {
        "secid": eastmoney_secid(clean),
        "fields1": "f1,f2,f3,f4,f5,f6",
        "fields2": "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
        "klt": "101",
        "fqt": "1",
        "beg": (datetime.now() - timedelta(days=540)).strftime("%Y%m%d"),
        "end": "20500101",
    }
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://quote.eastmoney.com/",
    }
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            response = requests.get(
                "https://push2his.eastmoney.com/api/qt/stock/kline/get",
                params=params,
                headers=headers,
                timeout=20,
            )
            response.raise_for_status()
            break
        except Exception as error:
            last_error = error
            if attempt < 2:
                time.sleep(0.8 * (attempt + 1))
    else:
        raise RuntimeError(f"EASTMONEY_REQUEST_FAILED:{last_error}") from last_error

    payload = response.json()
    klines = payload.get("data", {}).get("klines") or []
    if not klines:
        raise RuntimeError("EASTMONEY_EMPTY_HISTORY")

    rows = []
    for item in klines:
        parts = item.split(",")
        if len(parts) < 11:
            continue
        rows.append(
            {
                "trade_date": parts[0].replace("-", ""),
                "open": float(parts[1]),
                "close": float(parts[2]),
                "high": float(parts[3]),
                "low": float(parts[4]),
                "volume": float(parts[5]),
                "amount": float(parts[6]),
                "amplitude": float(parts[7]),
                "pct_chg": float(parts[8]),
                "change": float(parts[9]),
                "turnover": float(parts[10]),
            }
        )
    if not rows:
        raise RuntimeError("EASTMONEY_EMPTY_HISTORY")

    recent = rows[-80:]
    closes = [row["close"] for row in recent]
    last_row = recent[-1]
    ten = recent[-10:] if len(recent) >= 10 else recent
    ten_closes = [row["close"] for row in ten]
    spark_min = min(ten_closes)
    spark_range = max(ten_closes) - spark_min or 1

    stock = {**stock}
    stock["price"] = price_to_text(last_row["close"])
    stock["change"] = format_change(last_row["pct_chg"])
    stock["performance"] = {
        **stock["performance"],
        "day": round(last_row["pct_chg"], 2),
        "week": round((closes[-1] - closes[-5]) / closes[-5] * 100, 2) if len(closes) >= 5 else 0,
        "month": round((closes[-1] - closes[-20]) / closes[-20] * 100, 2) if len(closes) >= 20 else 0,
    }
    stock["chart"] = [round(row["close"], 2) for row in ten]
    stock["sparkline"] = [
        round(40 + ((row["close"] - spark_min) / spark_range) * 22, 2)
        for row in ten
    ]
    stock["updated"] = f"日K {last_row['trade_date']}"
    stock["dataCoverage"] = {
        **stock.get("dataCoverage", {}),
        "quote": True,
        "history": True,
        "historySource": "eastmoney",
    }
    stock["klineRows"] = [
        {
            "date": row["trade_date"],
            "open": round(row["open"], 2),
            "close": round(row["close"], 2),
            "high": round(row["high"], 2),
            "low": round(row["low"], 2),
            "volume": row["volume"],
            "amount": row["amount"],
            "pctChg": round(row["pct_chg"], 2),
        }
        for row in ten
    ]
    previous_close = round(last_row["close"] - last_row["change"], 2)
    quote_stats: dict[str, Any] = {
        "open": round(last_row["open"], 2),
        "previousClose": previous_close,
        "dayHigh": round(last_row["high"], 2),
        "dayLow": round(last_row["low"], 2),
        "historyHigh": round(max(row["high"] for row in recent), 2),
        "historyLow": round(min(row["low"] for row in recent), 2),
        "volume": compact_volume(last_row["volume"]),
        "amount": compact_yuan(last_row["amount"]),
        "marketCap": None,
        "period": f"近{len(recent)}个交易日",
        "source": "东方财富",
    }
    try:
        live_stats = fetch_eastmoney_quote_stats(clean)
        quote_stats = {**quote_stats, **{key: value for key, value in live_stats.items() if value is not None}}
    except Exception:
        pass
    stock["quoteStats"] = quote_stats
    stock["metrics"] = [
        ["当前价", price_to_text(last_row["close"]), "日K"],
        ["成交额", f"{round(last_row['amount'] / 100000000, 2)}亿", "跟踪"],
        ["数据源", "东方财富", "历史K"],
    ]
    stock["pulse"] = f"已补充东方财富日K，近一月走势 {format_change(stock['performance']['month'])}。"
    upsert_stock(stock)
    return stock


def refresh_market_data(codes: list[str] | None = None) -> dict[str, Any]:
    target_codes = [clean_code(code) for code in (codes or [stock["code"] for stock in list_stocks()])]
    target_codes = [code for code in target_codes if code]
    refreshed_codes: list[str] = []
    providers: list[str] = []
    errors: list[str] = []

    try:
        easy_quotes, provider = fetch_easy_quotes(target_codes)
        providers.append(f"easyquotation:{provider}")
        for code in target_codes:
            stock = get_stock_or_404(code)
            quote = easy_quotes.get(quote_symbol(code))
            if not quote:
                continue
            stock = update_stock_with_easy_quote(stock, quote)
            upsert_stock(stock)
            refreshed_codes.append(code)
    except Exception as error:
        errors.append(f"easyquotation:{type(error).__name__}")

    try:
        import akshare as ak

        spot_df = None
        providers.append("akshare")
        try:
            spot_df = ak.stock_zh_a_spot_em()
        except Exception as error:
            errors.append(f"akshare-spot:{type(error).__name__}")

        for code in target_codes:
            stock = get_stock_or_404(code)
            if spot_df is not None:
                spot_match = spot_df[spot_df["代码"].astype(str) == code]
            else:
                spot_match = None
            if spot_match is not None and not spot_match.empty:
                stock = update_stock_with_spot(stock, spot_match.iloc[0])
            try:
                hist_df = ak.stock_zh_a_hist(symbol=code, period="daily", adjust="qfq")
                stock = update_stock_with_hist(stock, hist_df)
            except Exception:
                errors.append(f"akshare-hist:{code}")
            upsert_stock(stock)
            if code not in refreshed_codes:
                refreshed_codes.append(code)

        status = {
            "mode": "live" if refreshed_codes else "fallback",
            "source": ", ".join(providers) if providers else "cache",
            "lastRefresh": now_text(),
            "message": "已刷新行情数据。" if refreshed_codes else "行情源暂不可用，继续使用缓存/演示数据。",
            "refreshedCodes": refreshed_codes,
            "errors": errors,
        }
        return save_data_status(status)
    except Exception as error:
        errors.append(f"akshare:{type(error).__name__}")
        if refreshed_codes:
            status = {
                "mode": "live",
                "source": ", ".join(providers) if providers else "easyquotation",
                "lastRefresh": now_text(),
                "message": "已刷新实时报价，历史 K线暂未更新。",
                "refreshedCodes": refreshed_codes,
                "errors": errors,
            }
            return save_data_status(status)
        status = {
            "mode": "fallback",
            "source": ", ".join(providers) if providers else "easyquotation, akshare",
            "lastRefresh": now_text(),
            "message": "行情源暂不可用，已保留缓存/演示数据。",
            "refreshedCodes": [],
            "errors": errors,
        }
        return save_data_status(status)


def refresh_quote_data(codes: list[str]) -> dict[str, Any]:
    target_codes = [clean_code(code) for code in codes if clean_code(code)]
    refreshed_codes: list[str] = []
    errors: list[str] = []
    source = "easyquotation"

    if not target_codes:
        return {
            "mode": "empty",
            "source": "cache",
            "lastRefresh": get_data_status().get("lastRefresh"),
            "message": "没有需要刷新的股票。",
            "refreshedCodes": [],
            "errors": [],
        }

    try:
        easy_quotes, provider = fetch_easy_quotes(target_codes)
        source = f"easyquotation:{provider}"
        for code in target_codes:
            quote = easy_quotes.get(quote_symbol(code))
            if not quote:
                continue
            stock = update_stock_with_easy_quote(get_stock_or_404(code), quote)
            stock = mark_stock_cache(stock, "quoteRefreshedAt")
            upsert_stock(stock)
            refreshed_codes.append(code)
    except Exception as error:
        errors.append(f"easyquotation:{type(error).__name__}")

    status = {
        "mode": "live" if refreshed_codes else "fallback",
        "source": source,
        "lastRefresh": now_text(),
        "message": "已刷新实时报价。" if refreshed_codes else "实时报价源暂不可用，继续使用缓存。",
        "refreshedCodes": refreshed_codes,
        "errors": errors,
    }
    return save_data_status(status)


def refresh_cached_quotes(
    codes: list[str],
    max_age_minutes: int = QUOTE_CACHE_MINUTES,
    allow_network: bool = True,
) -> dict[str, Any]:
    target_codes = [clean_code(code) for code in codes if clean_code(code)]
    stale_codes = []
    for code in target_codes:
        try:
            stock = get_stock_or_404(code)
        except HTTPException:
            continue
        if stock_cache_is_stale(stock, "quoteRefreshedAt", max_age_minutes):
            stale_codes.append(code)

    if not stale_codes:
        return {
            "mode": "cache",
            "source": "sqlite",
            "lastRefresh": get_data_status().get("lastRefresh"),
            "message": f"行情缓存仍有效，{max_age_minutes} 分钟内不重复刷新。",
            "refreshedCodes": [],
            "cacheHit": True,
        }

    if not allow_network:
        status = {
            "mode": "cache-stale",
            "source": "sqlite",
            "lastRefresh": get_data_status().get("lastRefresh"),
            "message": "行情缓存已过期，已返回本地缓存，等待后台刷新。",
            "refreshedCodes": [],
            "staleCodes": stale_codes,
            "cacheHit": True,
        }
        return status

    status = refresh_quote_data(stale_codes)
    return {**status, "cacheHit": False, "requestedCodes": stale_codes}


def ensure_stock_history(code: str, max_age_minutes: int = HISTORY_CACHE_MINUTES) -> dict[str, Any]:
    stock = apply_snapshot_history(get_stock_or_404(code))
    has_history = bool(stock.get("klineRows"))
    if has_history and not stock_cache_is_stale(stock, "historyRefreshedAt", max_age_minutes):
        return apply_analysis_score(stock)
    try:
        stock = refresh_eastmoney_history(code)
        stock = mark_stock_cache(stock, "historyRefreshedAt")
        stock = apply_analysis_score(stock)
        upsert_stock(stock)
        return stock
    except Exception:
        stock = apply_analysis_score(stock)
        upsert_stock(stock)
        return stock


def build_kline(stock: dict[str, Any]) -> list[dict[str, float | str]]:
    candles = []
    for index, close in enumerate(stock["chart"]):
        previous = stock["chart"][index - 1] if index > 0 else close * 0.985
        open_price = previous if index > 0 else previous
        swing = max(close * 0.012, 0.08)
        high = max(open_price, close) + swing * (1.2 if index % 3 == 0 else 0.72)
        low = min(open_price, close) - swing * (0.9 if index % 2 == 0 else 0.58)
        candles.append(
            {
                "date": f"D{index + 1}",
                "open": round(open_price, 2),
                "close": round(close, 2),
                "high": round(high, 2),
                "low": round(low, 2),
            }
        )
    return candles


def init_db() -> None:
    with connect() as db:
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS stocks (
              code TEXT PRIMARY KEY,
              payload TEXT NOT NULL
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS stock_directory (
              code TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              industry TEXT DEFAULT 'A股',
              initials TEXT DEFAULT '',
              search_text TEXT NOT NULL,
              source TEXT NOT NULL,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              display_name TEXT NOT NULL,
              risk_level TEXT NOT NULL,
              default_market TEXT NOT NULL,
              phone TEXT,
              wechat_openid TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        existing_user_columns = {
            row["name"] for row in db.execute("PRAGMA table_info(users)").fetchall()
        }
        if "phone" not in existing_user_columns:
            db.execute("ALTER TABLE users ADD COLUMN phone TEXT")
        if "wechat_openid" not in existing_user_columns:
            db.execute("ALTER TABLE users ADD COLUMN wechat_openid TEXT")
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS auth_sms_codes (
              phone TEXT PRIMARY KEY,
              code TEXT NOT NULL,
              expires_at TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS auth_sms_logs (
              id TEXT PRIMARY KEY,
              phone TEXT NOT NULL,
              provider TEXT NOT NULL,
              success INTEGER NOT NULL,
              message TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS auth_sessions (
              token TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              device_name TEXT DEFAULT 'Web 设备',
              user_agent TEXT DEFAULT '',
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
              expires_at TEXT NOT NULL,
              revoked_at TEXT
            )
            """
        )
        existing_session_columns = {
            row["name"] for row in db.execute("PRAGMA table_info(auth_sessions)").fetchall()
        }
        if "device_name" not in existing_session_columns:
            db.execute("ALTER TABLE auth_sessions ADD COLUMN device_name TEXT DEFAULT 'Web 设备'")
        if "user_agent" not in existing_session_columns:
            db.execute("ALTER TABLE auth_sessions ADD COLUMN user_agent TEXT DEFAULT ''")
        if "last_seen_at" not in existing_session_columns:
            db.execute("ALTER TABLE auth_sessions ADD COLUMN last_seen_at TEXT")
            db.execute("UPDATE auth_sessions SET last_seen_at = COALESCE(last_seen_at, created_at, CURRENT_TIMESTAMP)")
        if "revoked_at" not in existing_session_columns:
            db.execute("ALTER TABLE auth_sessions ADD COLUMN revoked_at TEXT")
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS watchlist (
              code TEXT NOT NULL,
              user_id TEXT DEFAULT 'default_user',
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (user_id, code)
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS portfolio (
              code TEXT NOT NULL,
              user_id TEXT DEFAULT 'default_user',
              amount REAL NOT NULL,
              shares INTEGER,
              cost_price REAL,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (user_id, code)
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS portfolio_transactions (
              id TEXT PRIMARY KEY,
              user_id TEXT DEFAULT 'default_user',
              code TEXT NOT NULL,
              action TEXT NOT NULL,
              amount REAL NOT NULL,
              shares INTEGER NOT NULL,
              price REAL NOT NULL,
              note TEXT DEFAULT '',
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS portfolio_advice_snapshots (
              id TEXT PRIMARY KEY,
              user_id TEXT DEFAULT 'default_user',
              code TEXT NOT NULL,
              model_version TEXT DEFAULT 'advice-v1',
              action_code TEXT NOT NULL,
              action_label TEXT NOT NULL,
              score INTEGER NOT NULL,
              risk_level TEXT NOT NULL,
              position_ratio REAL NOT NULL,
              total_gain_rate REAL NOT NULL,
              payload TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS recommendation_feedback (
              id TEXT PRIMARY KEY,
              user_id TEXT DEFAULT 'default_user',
              code TEXT NOT NULL,
              action TEXT NOT NULL,
              source TEXT NOT NULL,
              payload TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS user_personas (
              user_id TEXT PRIMARY KEY,
              payload TEXT NOT NULL,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS news_cache (
              code TEXT PRIMARY KEY,
              payload TEXT NOT NULL,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS task_runs (
              id TEXT PRIMARY KEY,
              task_id TEXT NOT NULL,
              source TEXT NOT NULL,
              status TEXT NOT NULL,
              duration_ms INTEGER NOT NULL,
              error TEXT,
              payload TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS error_audit_logs (
              id TEXT PRIMARY KEY,
              user_id TEXT DEFAULT 'default_user',
              path TEXT NOT NULL,
              method TEXT NOT NULL,
              status_code INTEGER NOT NULL,
              message TEXT NOT NULL,
              ip TEXT DEFAULT '',
              payload TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS portfolio_advice_backtests (
              id TEXT PRIMARY KEY,
              advice_id TEXT NOT NULL,
              user_id TEXT DEFAULT 'default_user',
              code TEXT NOT NULL,
              horizon_days INTEGER NOT NULL,
              entry_date TEXT NOT NULL,
              target_date TEXT,
              entry_price REAL,
              target_price REAL,
              return_pct REAL,
              hit INTEGER,
              status TEXT NOT NULL,
              payload TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(advice_id, horizon_days)
            )
            """
        )
        existing_watchlist_columns = {
            row["name"] for row in db.execute("PRAGMA table_info(watchlist)").fetchall()
        }
        if "user_id" not in existing_watchlist_columns:
            db.execute("ALTER TABLE watchlist ADD COLUMN user_id TEXT DEFAULT 'default_user'")
        existing_portfolio_columns = {
            row["name"] for row in db.execute("PRAGMA table_info(portfolio)").fetchall()
        }
        if "user_id" not in existing_portfolio_columns:
            db.execute("ALTER TABLE portfolio ADD COLUMN user_id TEXT DEFAULT 'default_user'")
        if "shares" not in existing_portfolio_columns:
            db.execute("ALTER TABLE portfolio ADD COLUMN shares INTEGER")
        if "cost_price" not in existing_portfolio_columns:
            db.execute("ALTER TABLE portfolio ADD COLUMN cost_price REAL")
        existing_advice_columns = {
            row["name"] for row in db.execute("PRAGMA table_info(portfolio_advice_snapshots)").fetchall()
        }
        if "model_version" not in existing_advice_columns:
            db.execute("ALTER TABLE portfolio_advice_snapshots ADD COLUMN model_version TEXT DEFAULT 'advice-v1'")
        watchlist_pk = [row["name"] for row in db.execute("PRAGMA table_info(watchlist)").fetchall() if row["pk"]]
        if watchlist_pk == ["code"]:
            db.execute(
                """
                CREATE TABLE watchlist_next (
                  code TEXT NOT NULL,
                  user_id TEXT DEFAULT 'default_user',
                  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (user_id, code)
                )
                """
            )
            db.execute(
                """
                INSERT OR IGNORE INTO watchlist_next (code, user_id, created_at)
                SELECT code, COALESCE(user_id, 'default_user'), created_at FROM watchlist
                """
            )
            db.execute("DROP TABLE watchlist")
            db.execute("ALTER TABLE watchlist_next RENAME TO watchlist")
        portfolio_pk = [row["name"] for row in db.execute("PRAGMA table_info(portfolio)").fetchall() if row["pk"]]
        if portfolio_pk == ["code"]:
            db.execute(
                """
                CREATE TABLE portfolio_next (
                  code TEXT NOT NULL,
                  user_id TEXT DEFAULT 'default_user',
                  amount REAL NOT NULL,
                  shares INTEGER,
                  cost_price REAL,
                  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (user_id, code)
                )
                """
            )
            db.execute(
                """
                INSERT OR IGNORE INTO portfolio_next (code, user_id, amount, shares, cost_price, updated_at)
                SELECT code, COALESCE(user_id, 'default_user'), amount, shares, cost_price, updated_at FROM portfolio
                """
            )
            db.execute("DROP TABLE portfolio")
            db.execute("ALTER TABLE portfolio_next RENAME TO portfolio")
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS app_settings (
              key TEXT PRIMARY KEY,
              payload TEXT NOT NULL
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS stock_daily_snapshots (
              code TEXT NOT NULL,
              trade_date TEXT NOT NULL,
              open REAL NOT NULL,
              high REAL NOT NULL,
              low REAL NOT NULL,
              close REAL NOT NULL,
              pre_close REAL,
              volume REAL,
              amount REAL,
              source TEXT NOT NULL,
              payload TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (code, trade_date)
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS alert_events (
              id TEXT PRIMARY KEY,
              user_id TEXT DEFAULT 'default_user',
              code TEXT NOT NULL,
              event_type TEXT NOT NULL,
              severity TEXT NOT NULL,
              title TEXT NOT NULL,
              text TEXT NOT NULL,
              payload TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              read_at TEXT
            )
            """
        )
        existing_alert_columns = {
            row["name"] for row in db.execute("PRAGMA table_info(alert_events)").fetchall()
        }
        if "user_id" not in existing_alert_columns:
            db.execute("ALTER TABLE alert_events ADD COLUMN user_id TEXT DEFAULT 'default_user'")
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_alert_events_created ON alert_events (created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_stock_directory_name ON stock_directory (name)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_stock_directory_initials ON stock_directory (initials)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_stock_directory_search ON stock_directory (search_text)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_watchlist_user_created ON watchlist (user_id, created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_portfolio_user_updated ON portfolio (user_id, updated_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_user_created ON portfolio_transactions (user_id, created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_user_code ON portfolio_transactions (user_id, code, created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_portfolio_advice_user_created ON portfolio_advice_snapshots (user_id, created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_portfolio_advice_user_code_created ON portfolio_advice_snapshots (user_id, code, created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_portfolio_backtests_user_created ON portfolio_advice_backtests (user_id, created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_portfolio_backtests_advice ON portfolio_advice_backtests (advice_id)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_alert_events_user_created ON alert_events (user_id, created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_created ON recommendation_feedback (user_id, created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_code ON recommendation_feedback (user_id, code, created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_task_runs_task_created ON task_runs (task_id, created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_error_audit_created ON error_audit_logs (created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_error_audit_user_created ON error_audit_logs (user_id, created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions (user_id)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_auth_sms_logs_phone_created ON auth_sms_logs (phone, created_at DESC)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_users_wechat ON users (wechat_openid)"
        )
        for code, stock in STOCKS.items():
            db.execute(
                "INSERT OR REPLACE INTO stocks (code, payload) VALUES (?, ?)",
                (code, to_json(stock)),
            )
        seeded_items = [normalize_directory_item(item, "seed") for item in A_STOCK_SEARCH_SEEDS]
        db.executemany(
            """
            INSERT INTO stock_directory (
              code, name, industry, initials, search_text, source, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET
              name = excluded.name,
              industry = excluded.industry,
              initials = excluded.initials,
              search_text = excluded.search_text,
              source = excluded.source,
              updated_at = excluded.updated_at
            """,
            [
                (
                    item["code"],
                    item["name"],
                    item["industry"],
                    item["initials"],
                    item["searchText"],
                    item["source"],
                    now_text(),
                )
                for item in seeded_items
            ],
        )
        if not db.execute("SELECT 1 FROM watchlist LIMIT 1").fetchone():
            db.execute("INSERT INTO watchlist (code, user_id) VALUES (?, ?)", ("600519", DEFAULT_USER_ID))
        if not db.execute("SELECT 1 FROM portfolio LIMIT 1").fetchone():
            db.executemany(
                "INSERT INTO portfolio (code, user_id, amount) VALUES (?, ?, ?)",
                [("600519", DEFAULT_USER_ID, 42000), ("300750", DEFAULT_USER_ID, 26000)],
            )
        db.execute(
            """
            INSERT OR IGNORE INTO users (id, display_name, risk_level, default_market)
            VALUES (?, ?, ?, ?)
            """,
            (
                DEFAULT_USER_ID,
                DEFAULT_USER_PROFILE["displayName"],
                DEFAULT_USER_PROFILE["riskLevel"],
                DEFAULT_USER_PROFILE["defaultMarket"],
            ),
        )
        db.execute(
            "INSERT OR IGNORE INTO app_settings (key, payload) VALUES (?, ?)",
            ("alerts", to_json(DEFAULT_ALERT_SETTINGS)),
        )
        db.execute(
            "INSERT OR IGNORE INTO app_settings (key, payload) VALUES (?, ?)",
            (alert_settings_key(DEFAULT_USER_ID), to_json(DEFAULT_ALERT_SETTINGS)),
        )
        db.execute(
            "INSERT OR IGNORE INTO app_settings (key, payload) VALUES (?, ?)",
            ("data_status", to_json(DEFAULT_DATA_STATUS)),
        )
        db.execute(
            "INSERT OR IGNORE INTO app_settings (key, payload) VALUES (?, ?)",
            ("stock_directory_status", to_json(DEFAULT_DIRECTORY_STATUS)),
        )


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    background_task = asyncio.create_task(background_task_loop())
    try:
        yield
    finally:
        background_task.cancel()
        with suppress(asyncio.CancelledError):
            await background_task


app = FastAPI(title="股镜 API", version="0.1.0", lifespan=lifespan)
DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://10.85.68.192:5173",
    "capacitor://localhost",
    "ionic://localhost",
    "gujing://localhost",
]
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", ",".join(DEFAULT_CORS_ORIGINS)).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_context_middleware(request: Request, call_next):
    enforce_rate_limit(request)
    token = bearer_token_from_header(request.headers.get("authorization"))
    user_id = user_id_from_token(token) or DEFAULT_USER_ID
    if user_id != DEFAULT_USER_ID:
        touch_auth_session(token)
    context_token = CURRENT_USER_ID.set(user_id)
    try:
        response = await call_next(request)
        if response.status_code >= 500:
            record_error_audit(
                path=request.url.path,
                method=request.method,
                status_code=response.status_code,
                message=f"HTTP {response.status_code}",
                user_id=user_id,
                ip=client_ip(request),
            )
        return response
    except Exception as error:
        record_error_audit(
            path=request.url.path,
            method=request.method,
            status_code=500,
            message=type(error).__name__,
            user_id=user_id,
            ip=client_ip(request),
            payload={"detail": str(error)[:240]},
        )
        raise
    finally:
        CURRENT_USER_ID.reset(context_token)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "gujing-api"}


@app.get("/api/system/readiness")
def system_readiness_index() -> dict[str, Any]:
    return system_readiness_payload()


@app.get("/api/system/errors")
def system_errors_index(limit: int = 20) -> dict[str, Any]:
    return {"items": recent_error_audit(limit=limit)}


@app.post("/api/system/errors", status_code=201)
def system_error_create(payload: ErrorAuditPayload) -> dict[str, Any]:
    record_error_audit(
        path=payload.path,
        method="CLIENT",
        status_code=payload.statusCode,
        message=payload.message,
        payload={"source": "client"},
    )
    return {"ok": True}


@app.get("/api/data/status")
def data_status_show() -> dict[str, Any]:
    status = get_data_status()
    directory_status = get_directory_status()
    source_score, source_label = source_reliability_label(status.get("source"))
    return {
        **status,
        "stockDirectory": {
            **directory_status,
            "refreshIntervalMinutes": DIRECTORY_REFRESH_MINUTES,
            "stale": stock_directory_is_stale(),
        },
        "sourceTrust": {
            "score": source_score,
            "label": source_label,
            "source": status.get("source"),
        },
        "providers": {
            "quote": ["easyquotation:tencent", "easyquotation:sina"],
            "history": ["Tushare", "东方财富"],
            "news": ["AkShare 东方财富新闻", "news_cache"],
            "fundamental": ["东方财富扩展字段", "待接入财报源"],
        },
        "cachePolicy": {
            "quoteMinutes": QUOTE_CACHE_MINUTES,
            "marketMinutes": MARKET_REFRESH_MINUTES,
            "historyMinutes": HISTORY_CACHE_MINUTES,
            "newsMinutes": NEWS_CACHE_MINUTES,
        },
    }


@app.post("/api/data/refresh")
def data_refresh(payload: RefreshPayload | None = None) -> dict[str, Any]:
    return refresh_market_data(payload.codes if payload else None)


@app.post("/api/data/sync-universe")
def data_sync_universe() -> dict[str, Any]:
    return sync_market_universe()


@app.post("/api/data/sync-stock-directory")
def data_sync_stock_directory() -> dict[str, Any]:
    return refresh_stock_directory(force=True)


@app.get("/api/data/stock-directory")
def data_stock_directory_index(keyword: str = "", limit: int = 50) -> dict[str, Any]:
    return {
        "status": get_directory_status(),
        "items": stock_directory_rows(keyword=keyword, limit=limit),
    }


@app.post("/api/data/snapshot")
def data_snapshot_create() -> dict[str, Any]:
    return sync_market_universe()


@app.get("/api/tasks/status")
def tasks_status_show() -> dict[str, Any]:
    return list_task_statuses()


@app.post("/api/tasks/run")
def tasks_run(payload: TaskRunPayload | None = None) -> dict[str, Any]:
    task_id = payload.taskId if payload else None
    if task_id:
        if task_id not in BACKGROUND_TASKS:
            raise HTTPException(status_code=404, detail="task not found")
        return {"tasks": [run_background_task(task_id, "manual")]}
    return {
        "tasks": [
            run_background_task(next_task_id, "manual")
            for next_task_id in BACKGROUND_TASKS
        ]
    }


@app.get("/api/data/tushare/status")
def tushare_status() -> dict[str, Any]:
    return {"configured": bool(get_tushare_token())}


@app.post("/api/data/tushare/token")
def tushare_token_save(payload: TushareTokenPayload) -> dict[str, Any]:
    save_tushare_token(payload.token)
    return {"configured": True}


@app.get("/api/stocks")
def stocks_index() -> list[dict[str, Any]]:
    return [apply_analysis_score(stock) for stock in list_curated_stocks()]


def search_result_summary(stock: dict[str, Any]) -> dict[str, Any]:
    performance = stock.get("performance") or {}
    quote = stock.get("quote") or {}
    quote_stats = stock.get("quoteStats") or {}
    price = stock.get("price") or quote.get("now") or quote.get("price") or 0
    change = stock.get("change") or quote.get("change") or "0.00%"
    return {
        "code": stock.get("code"),
        "name": stock.get("name"),
        "market": stock.get("market", "cn"),
        "industry": stock.get("industry", "A股"),
        "price": str(price),
        "change": str(change),
        "performance": {
            "day": float(performance.get("day") or 0),
            "week": float(performance.get("week") or 0),
            "month": float(performance.get("month") or 0),
        },
        "sparkline": stock.get("sparkline") or [42, 43, 42, 44, 43, 45, 46],
        "chart": stock.get("chart") or stock.get("sparkline") or [42, 43, 42, 44, 43, 45, 46],
        "tone": stock.get("tone", "neutral"),
        "score": stock.get("score", 55),
        "tags": stock.get("tags", ["A股"]),
        "quoteStats": {
            "open": quote_stats.get("open"),
            "previousClose": quote_stats.get("previousClose"),
            "dayHigh": quote_stats.get("dayHigh"),
            "dayLow": quote_stats.get("dayLow"),
            "marketCap": quote_stats.get("marketCap"),
            "source": quote_stats.get("source") or quote.get("source"),
        },
        "updated": stock.get("updated") or stock.get("cache", {}).get("quoteRefreshedAt") or "待同步",
    }


@app.get("/api/stocks/search")
def stocks_search(keyword: str = "", full: bool = False, with_quotes: bool = False) -> list[dict[str, Any]]:
    results = search_stocks(keyword)
    if keyword.strip() and not results:
        existing_codes = {stock["code"] for stock in results}
        try:
            results.extend(
                stock for stock in directory_matches(keyword, 25, allow_network=True) if stock["code"] not in existing_codes
            )
        except Exception:
            pass
    if not results and keyword.strip():
        try:
            sync_market_universe()
            results = search_stocks(keyword)
        except Exception:
            results = []
    if with_quotes and results:
        refresh_cached_quotes([stock["code"] for stock in results[:8]])
        results = [get_stock_or_404(stock["code"]) for stock in results[:25]]
    if not full:
        return [search_result_summary(stock) for stock in results[:25]]
    return [apply_analysis_score(stock) for stock in results[:25]]


@app.get("/api/stocks/{code}")
def stocks_show(code: str) -> dict[str, Any]:
    refresh_cached_quotes([code])
    stock = apply_analysis_score(apply_snapshot_history(get_stock_or_404(code)))
    upsert_stock(stock)
    return stock


@app.post("/api/stocks/{code}/history/refresh")
def stocks_history_refresh(code: str) -> dict[str, Any]:
    errors: list[str] = []
    try:
        stock = apply_analysis_score(refresh_tushare_history(code))
        upsert_stock(stock)
        return stock
    except Exception as error:
        errors.append(f"tushare:{error}")

    try:
        stock = apply_analysis_score(refresh_eastmoney_history(code))
        if errors:
            stock["historyProviderErrors"] = errors
        upsert_stock(stock)
        return stock
    except Exception as error:
        errors.append(f"eastmoney:{error}")
        stock = get_stock_or_404(code)
        stock["dataCoverage"] = {**stock.get("dataCoverage", {}), "history": False}
        stock["historyProviderErrors"] = errors
        upsert_stock(stock)
        raise HTTPException(status_code=422, detail="; ".join(errors)) from error


@app.get("/api/stocks/{code}/kline")
def stocks_kline(code: str) -> dict[str, Any]:
    refresh_cached_quotes([code])
    stock = ensure_stock_history(code)
    if not stock.get("quoteStats", {}).get("marketCap"):
        try:
            stock = refresh_eastmoney_history(code)
            stock = mark_stock_cache(stock, "historyRefreshedAt")
        except Exception:
            pass
    stock = apply_analysis_score(stock)
    upsert_stock(stock)
    return {
        "code": stock["code"],
        "name": stock["name"],
        "candles": stock.get("klineRows") or build_kline(stock),
        "coverage": stock.get("dataCoverage", {}),
        "quoteStats": stock.get("quoteStats", {}),
        "stock": stock,
    }


@app.get("/api/stocks/{code}/analysis")
def stocks_analysis(code: str) -> dict[str, Any]:
    stock = apply_analysis_score(apply_snapshot_history(get_stock_or_404(code)))
    upsert_stock(stock)
    return {
        "code": stock["code"],
        "name": stock["name"],
        "analysisScore": stock["analysisScore"],
        "newsImpact": stock.get("newsImpact"),
    }


@app.get("/api/stocks/{code}/news")
def stocks_news(code: str) -> dict[str, Any]:
    stock = get_stock_or_404(code)
    return {
        "code": stock["code"],
        "name": stock["name"],
        "newsImpact": cached_stock_news_impact(code),
    }


@app.get("/api/stocks/{code}/snapshots")
def stocks_snapshots(code: str) -> dict[str, Any]:
    rows = get_snapshot_rows(code, 120)
    return {
        "code": clean_code(code),
        "count": len(rows),
        "rows": rows,
    }


@app.get("/api/market/overview")
def market_overview() -> dict[str, Any]:
    return market_overview_payload()


@app.get("/api/recommendations/today")
def today_recommendations() -> list[dict[str, Any]]:
    return today_recommendation_payload()


@app.post("/api/recommendations/feedback", status_code=201)
def recommendation_feedback_create(payload: RecommendationFeedbackPayload) -> dict[str, Any]:
    return record_recommendation_feedback(payload.code, payload.action, payload.source)


def user_profile_show(user_id: str | None = None) -> dict[str, Any]:
    owner_id = user_id or current_user_id()
    with connect() as db:
        row = db.execute("SELECT * FROM users WHERE id = ?", (owner_id,)).fetchone()
    return normalize_user_profile(row)


def ensure_phone_user(phone: str) -> dict[str, Any]:
    clean = clean_phone(phone)
    if not clean:
        raise HTTPException(status_code=422, detail="invalid phone")
    user_id = user_id_for_phone(clean)
    display_name = f"用户{clean[-4:]}" if len(clean) >= 4 else "新用户"
    with connect() as db:
        db.execute(
            """
            INSERT INTO users (id, display_name, risk_level, default_market, phone, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              phone = excluded.phone,
              updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, display_name, DEFAULT_USER_PROFILE["riskLevel"], DEFAULT_USER_PROFILE["defaultMarket"], clean),
        )
    return user_profile_show(user_id)


@app.get("/api/auth/me")
def auth_me(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    token = bearer_token_from_header(authorization)
    session = auth_session_from_token(token)
    if not session:
        return auth_payload(DEFAULT_USER_ID)
    return auth_payload(
        session["userId"],
        token=session["token"],
        expires_at=session["expiresAt"],
        should_refresh=session["shouldRefresh"],
    )


@app.post("/api/auth/refresh")
def auth_refresh(
    authorization: str | None = Header(default=None),
    user_agent: str | None = Header(default=None),
    x_device_name: str | None = Header(default=None),
) -> dict[str, Any]:
    token = bearer_token_from_header(authorization)
    session = auth_session_from_token(token)
    if not session:
        raise HTTPException(status_code=401, detail="session expired")
    with connect() as db:
        db.execute(
            "UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE token = ?",
            (token,),
        )
    next_session = create_auth_token(session["userId"], user_agent, x_device_name or session.get("deviceName"))
    return auth_payload(
        session["userId"],
        token=next_session["token"],
        expires_at=next_session["expiresAt"],
        should_refresh=False,
    )


@app.post("/api/auth/sms/send")
def auth_sms_send(payload: PhoneCodePayload) -> dict[str, Any]:
    phone = clean_phone(payload.phone)
    if not phone:
        raise HTTPException(status_code=422, detail="invalid phone")
    is_mock_sms = SMS_PROVIDER == "mock"
    code = "123456" if is_mock_sms or os.getenv("APP_ENV") != "production" else f"{secrets.randbelow(1_000_000):06d}"
    expires_at = (datetime.now() + timedelta(minutes=SMS_CODE_EXPIRE_MINUTES)).strftime("%Y-%m-%d %H:%M:%S")
    send_result = send_sms_code(phone, code)
    with connect() as db:
        db.execute(
            """
            INSERT INTO auth_sms_codes (phone, code, expires_at, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(phone) DO UPDATE SET
              code = excluded.code,
              expires_at = excluded.expires_at,
              created_at = CURRENT_TIMESTAMP
            """,
            (phone, code, expires_at),
        )
        db.execute(
            """
            INSERT INTO auth_sms_logs (id, phone, provider, success, message, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """,
            (
                secrets.token_urlsafe(12),
                phone,
                send_result["provider"],
                1 if send_result["sent"] else 0,
                send_result["message"],
            ),
        )
    response = {
        "sent": send_result["sent"],
        "phone": phone,
        "expiresAt": expires_at,
        "provider": send_result["provider"],
        "providerName": send_result["name"],
        "message": send_result["message"],
    }
    if is_mock_sms or os.getenv("APP_ENV") != "production":
        response["devCode"] = code
    return response


@app.get("/api/auth/sms/status")
def auth_sms_status() -> dict[str, Any]:
    status = sms_provider_status()
    with connect() as db:
        rows = db.execute(
            """
            SELECT phone, provider, success, message, created_at
            FROM auth_sms_logs
            ORDER BY created_at DESC
            LIMIT 5
            """
        ).fetchall()
    return {
        **status,
        "codeExpireMinutes": SMS_CODE_EXPIRE_MINUTES,
        "recent": [
            {
                "phone": row["phone"][-4:].rjust(len(row["phone"]), "*"),
                "provider": row["provider"],
                "success": bool(row["success"]),
                "message": row["message"],
                "createdAt": row["created_at"],
            }
            for row in rows
        ],
    }


@app.post("/api/auth/sms/login")
def auth_sms_login(
    payload: PhoneLoginPayload,
    user_agent: str | None = Header(default=None),
    x_device_name: str | None = Header(default=None),
) -> dict[str, Any]:
    phone = clean_phone(payload.phone)
    with connect() as db:
        row = db.execute(
            """
            SELECT code, expires_at FROM auth_sms_codes
            WHERE phone = ?
            """,
            (phone,),
        ).fetchone()
    is_dev_code = (SMS_PROVIDER == "mock" or os.getenv("APP_ENV") != "production") and payload.code == "123456"
    if not row and not is_dev_code:
        raise HTTPException(status_code=401, detail="code not found")
    if row and parse_refresh_time(row["expires_at"]) and datetime.now() > parse_refresh_time(row["expires_at"]):
        raise HTTPException(status_code=401, detail="code expired")
    if row and payload.code != row["code"] and not is_dev_code:
        raise HTTPException(status_code=401, detail="invalid code")
    profile = ensure_phone_user(phone)
    session = create_auth_token(profile["id"], user_agent, x_device_name)
    cleanup_expired_sessions()
    return auth_payload(profile["id"], session["token"], session["expiresAt"])


@app.post("/api/auth/wechat/login")
def auth_wechat_login(_: WechatLoginPayload) -> dict[str, Any]:
    if not os.getenv("WECHAT_APP_ID") or not os.getenv("WECHAT_APP_SECRET"):
        raise HTTPException(
            status_code=501,
            detail="微信登录需要先在微信开放平台创建移动应用，并配置 WECHAT_APP_ID/WECHAT_APP_SECRET。",
        )
    raise HTTPException(status_code=501, detail="微信授权换取 openid 的服务端流程待接入。")


@app.post("/api/auth/logout")
def auth_logout(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    token = bearer_token_from_header(authorization)
    if token:
        with connect() as db:
            db.execute(
                "UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE token = ?",
                (token,),
            )
    return {"ok": True}


@app.get("/api/auth/devices")
def auth_devices_index(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    token = bearer_token_from_header(authorization)
    session = auth_session_from_token(token)
    if not session:
        raise HTTPException(status_code=401, detail="session expired")
    return {
        "currentDeviceId": session_public_id(token),
        "devices": list_auth_devices(session["userId"], token),
    }


@app.delete("/api/auth/devices/{device_id}")
def auth_device_revoke(device_id: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    token = bearer_token_from_header(authorization)
    session = auth_session_from_token(token)
    if not session:
        raise HTTPException(status_code=401, detail="session expired")
    with connect() as db:
        rows = db.execute(
            "SELECT token FROM auth_sessions WHERE user_id = ? AND revoked_at IS NULL",
            (session["userId"],),
        ).fetchall()
        target = next((row["token"] for row in rows if session_public_id(row["token"]) == device_id), None)
        if not target:
            raise HTTPException(status_code=404, detail="device not found")
        db.execute(
            "UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE token = ?",
            (target,),
        )
    return {
        "currentDeviceId": session_public_id(token),
        "devices": list_auth_devices(session["userId"], token),
    }


def user_profile_summary(user_id: str | None = None) -> dict[str, Any]:
    owner_id = user_id or current_user_id()
    profile = user_profile_show(owner_id)
    portfolio = portfolio_snapshot(owner_id)
    with connect() as db:
        watch_count = db.execute(
            "SELECT COUNT(*) AS count FROM watchlist WHERE user_id = ?",
            (owner_id,),
        ).fetchone()
    return {
        "profile": profile,
        "persona": user_persona_show(owner_id),
        "stats": {
            "portfolioCount": len(portfolio["items"]),
            "watchlistCount": int(watch_count["count"] if watch_count else 0),
            "unreadAlerts": unread_alert_count(owner_id),
            "portfolioValue": portfolio["totalAmount"],
        },
    }


def user_export_payload(user_id: str | None = None) -> dict[str, Any]:
    owner_id = user_id or current_user_id()
    portfolio_data = portfolio_snapshot(owner_id)
    insights = portfolio_insights(portfolio_data)
    with connect() as db:
        watch_rows = db.execute(
            "SELECT code, created_at FROM watchlist WHERE user_id = ? ORDER BY created_at DESC",
            (owner_id,),
        ).fetchall()
        portfolio_rows = db.execute(
            "SELECT code, amount, shares, cost_price, updated_at FROM portfolio WHERE user_id = ? ORDER BY updated_at DESC",
            (owner_id,),
        ).fetchall()
    return {
        "exportedAt": now_text(),
        "userId": owner_id,
        "profile": user_profile_show(owner_id),
        "persona": user_persona_show(owner_id),
        "watchlist": [
            {
                "code": row["code"],
                "name": STOCKS.get(row["code"], {}).get("name", row["code"]),
                "createdAt": row["created_at"],
            }
            for row in watch_rows
        ],
        "portfolio": [
            {
                "code": row["code"],
                "name": STOCKS.get(row["code"], {}).get("name", row["code"]),
                "amount": round(float(row["amount"] or 0), 2),
                "shares": int(row["shares"] or 0),
                "costPrice": round(float(row["cost_price"] or 0), 2),
                "updatedAt": row["updated_at"],
            }
            for row in portfolio_rows
        ],
        "transactions": portfolio_transactions_snapshot(owner_id, limit=100),
        "adviceHistory": portfolio_advice_history_snapshot(owner_id, limit=100),
        "adviceBacktests": portfolio_advice_backtest_snapshot(owner_id, limit=100)["items"],
        "alerts": list_alert_events(limit=100, user_id=owner_id),
        "portfolioInsights": insights,
        "summary": user_profile_summary(owner_id)["stats"],
    }


def delete_user_account(user_id: str | None = None) -> dict[str, Any]:
    owner_id = user_id or current_user_id()
    if owner_id == DEFAULT_USER_ID:
        raise HTTPException(status_code=401, detail="login required")

    with connect() as db:
        user_row = db.execute(
            "SELECT phone FROM users WHERE id = ?",
            (owner_id,),
        ).fetchone()
        phone = user_row["phone"] if user_row else None
        deleted = {
            "watchlist": db.execute("DELETE FROM watchlist WHERE user_id = ?", (owner_id,)).rowcount,
            "portfolio": db.execute("DELETE FROM portfolio WHERE user_id = ?", (owner_id,)).rowcount,
            "transactions": db.execute("DELETE FROM portfolio_transactions WHERE user_id = ?", (owner_id,)).rowcount,
            "adviceHistory": db.execute("DELETE FROM portfolio_advice_snapshots WHERE user_id = ?", (owner_id,)).rowcount,
            "adviceBacktests": db.execute("DELETE FROM portfolio_advice_backtests WHERE user_id = ?", (owner_id,)).rowcount,
            "alerts": db.execute("DELETE FROM alert_events WHERE user_id = ?", (owner_id,)).rowcount,
            "recommendationFeedback": db.execute("DELETE FROM recommendation_feedback WHERE user_id = ?", (owner_id,)).rowcount,
            "personas": db.execute("DELETE FROM user_personas WHERE user_id = ?", (owner_id,)).rowcount,
            "sessions": db.execute("DELETE FROM auth_sessions WHERE user_id = ?", (owner_id,)).rowcount,
            "profile": db.execute("DELETE FROM users WHERE id = ?", (owner_id,)).rowcount,
        }
        db.execute("DELETE FROM app_settings WHERE key = ?", (alert_settings_key(owner_id),))
        db.execute("DELETE FROM error_audit_logs WHERE user_id = ?", (owner_id,))
        if phone:
            db.execute("DELETE FROM auth_sms_codes WHERE phone = ?", (phone,))
            db.execute("DELETE FROM auth_sms_logs WHERE phone = ?", (phone,))

    return {
        "ok": True,
        "deletedAt": now_text(),
        "userId": owner_id,
        "deleted": deleted,
    }


def database_readiness() -> dict[str, Any]:
    required_tables = {
        "stocks",
        "users",
        "watchlist",
        "portfolio",
        "recommendation_feedback",
        "user_personas",
        "news_cache",
        "task_runs",
        "error_audit_logs",
    }
    try:
        with connect() as db:
            rows = db.execute("SELECT name FROM sqlite_master WHERE type = 'table'").fetchall()
            tables = {row["name"] for row in rows}
            stock_count = db.execute("SELECT COUNT(*) AS count FROM stocks").fetchone()["count"]
        missing = sorted(required_tables - tables)
        return {
            "ok": not missing,
            "path": str(DB_PATH),
            "stockCount": int(stock_count or 0),
            "missingTables": missing,
        }
    except Exception as error:
        return {"ok": False, "path": str(DB_PATH), "error": type(error).__name__}


def system_readiness_payload() -> dict[str, Any]:
    data_status = get_data_status()
    tasks = list_task_statuses()["tasks"]
    task_errors = [
        {
            "taskId": task["taskId"],
            "lastError": task.get("lastError") or (task.get("health") or {}).get("lastError"),
            "consecutiveFailures": (task.get("health") or {}).get("consecutiveFailures", 0),
        }
        for task in tasks
        if task.get("lastError") or (task.get("health") or {}).get("consecutiveFailures", 0)
    ]
    sms_status = sms_provider_status()
    checks = {
        "database": database_readiness(),
        "data": {
            "ok": data_status.get("mode") in {"live", "fallback", "demo"},
            "mode": data_status.get("mode"),
            "source": data_status.get("source"),
            "lastRefresh": data_status.get("lastRefresh"),
            "message": data_status.get("message"),
        },
        "sms": {
            "ok": bool(sms_status.get("ready")),
            "provider": sms_status.get("provider"),
            "name": sms_status.get("name"),
            "pendingEnv": sms_status.get("pending", []),
        },
        "wechat": {
            "ok": bool(os.getenv("WECHAT_APP_ID") and os.getenv("WECHAT_APP_SECRET")),
            "pendingEnv": [
                key
                for key in ("WECHAT_APP_ID", "WECHAT_APP_SECRET")
                if not os.getenv(key)
            ],
        },
        "tushare": {
            "ok": bool(get_tushare_token()),
            "configured": bool(get_tushare_token()),
        },
        "cors": {
            "ok": True,
            "allowedOrigins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        },
        "frontend": {
            "ok": True,
            "expectedApiBaseUrl": "http://localhost:8010",
            "viteEnv": "VITE_API_BASE_URL 可覆盖，默认 http://localhost:8010",
        },
        "tasks": {
            "ok": not task_errors,
            "count": len(tasks),
            "errors": task_errors,
        },
        "errors": {
            "ok": not recent_error_audit(limit=1),
            "recent": recent_error_audit(limit=5),
        },
    }
    required_ok = ["database", "data", "cors", "frontend"]
    optional_ok = ["sms", "wechat", "tushare", "tasks", "errors"]
    status = "ready" if all(checks[key]["ok"] for key in required_ok) else "blocked"
    if status == "ready" and any(not checks[key]["ok"] for key in optional_ok):
        status = "needs_config"
    return {
        "status": status,
        "updatedAt": now_text(),
        "checks": checks,
    }


@app.get("/api/user/profile")
def user_profile_index() -> dict[str, Any]:
    return user_profile_show()


@app.put("/api/user/profile")
def user_profile_update(payload: UserProfilePayload) -> dict[str, Any]:
    data = payload.model_dump()
    owner_id = current_user_id()
    with connect() as db:
        db.execute(
            """
            INSERT INTO users (id, display_name, risk_level, default_market, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              display_name = excluded.display_name,
              risk_level = excluded.risk_level,
              default_market = excluded.default_market,
              updated_at = CURRENT_TIMESTAMP
            """,
            (owner_id, data["displayName"], data["riskLevel"], data["defaultMarket"]),
        )
    return user_profile_show(owner_id)


@app.get("/api/user/summary")
def user_summary_index() -> dict[str, Any]:
    return user_profile_summary()


@app.get("/api/user/persona")
def user_persona_index() -> dict[str, Any]:
    return user_persona_show()


@app.get("/api/user/export")
def user_export_index() -> dict[str, Any]:
    return user_export_payload()


@app.delete("/api/user/account")
def user_account_delete() -> dict[str, Any]:
    return delete_user_account()


@app.get("/api/watchlist")
def watchlist_index(refresh: bool = False) -> list[dict[str, Any]]:
    owner_id = current_user_id()
    with connect() as db:
        rows = db.execute(
            "SELECT code FROM watchlist WHERE user_id = ? ORDER BY created_at DESC",
            (owner_id,),
        ).fetchall()
    refresh_cached_quotes([row["code"] for row in rows], allow_network=refresh)
    return [get_stock_or_404(row["code"]) for row in rows]


@app.post("/api/watchlist", status_code=201)
def watchlist_create(payload: CodePayload) -> list[dict[str, Any]]:
    code = clean_code(payload.code)
    get_stock_or_404(code)
    owner_id = current_user_id()
    with connect() as db:
        db.execute("INSERT OR IGNORE INTO watchlist (code, user_id) VALUES (?, ?)", (code, owner_id))
    return watchlist_index()


@app.delete("/api/watchlist/{code}")
def watchlist_delete(code: str) -> list[dict[str, Any]]:
    owner_id = current_user_id()
    with connect() as db:
        db.execute("DELETE FROM watchlist WHERE code = ? AND user_id = ?", (clean_code(code), owner_id))
    return watchlist_index()


def portfolio_transaction_row(row: sqlite3.Row) -> dict[str, Any]:
    stock = STOCKS.get(row["code"]) or {}
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "code": row["code"],
        "name": stock.get("name", row["code"]),
        "action": row["action"],
        "amount": round(float(row["amount"] or 0), 2),
        "shares": int(row["shares"] or 0),
        "price": round(float(row["price"] or 0), 2),
        "note": row["note"] or "",
        "createdAt": row["created_at"],
    }


def record_portfolio_transaction(
    db: sqlite3.Connection,
    *,
    user_id: str,
    code: str,
    action: str,
    amount: float,
    shares: int,
    price: float,
    note: str = "",
) -> None:
    db.execute(
        """
        INSERT INTO portfolio_transactions (id, user_id, code, action, amount, shares, price, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """,
        (
            secrets.token_hex(12),
            user_id,
            clean_code(code),
            action,
            round(float(amount or 0), 2),
            int(shares or 0),
            round(float(price or 0), 2),
            note.strip()[:120],
        ),
    )


def portfolio_advice_snapshot_row(row: sqlite3.Row) -> dict[str, Any]:
    stock = STOCKS.get(row["code"]) or {}
    payload: Any = {}
    with suppress(Exception):
        payload = from_json(row["payload"])
    if not isinstance(payload, dict):
        payload = {}
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "code": row["code"],
        "name": stock.get("name", row["code"]),
        "actionCode": row["action_code"],
        "actionLabel": row["action_label"],
        "modelVersion": row["model_version"] if "model_version" in row.keys() else "advice-v1",
        "score": int(row["score"] or 0),
        "riskLevel": row["risk_level"],
        "positionRatio": round(float(row["position_ratio"] or 0), 2),
        "totalGainRate": round(float(row["total_gain_rate"] or 0), 2),
        "payload": payload,
        "createdAt": row["created_at"],
    }


def record_portfolio_advice_snapshot(
    db: sqlite3.Connection,
    *,
    user_id: str,
    item: dict[str, Any],
) -> None:
    engine = item.get("adviceEngine") or {}
    action = engine.get("action") or {}
    risk_profile = engine.get("riskProfile") or {}
    clean = clean_code(str(item.get("code") or ""))
    action_code = str(action.get("code") or "watch")
    action_label = str(action.get("label") or engine.get("stance") or "观察")
    previous = db.execute(
        """
        SELECT id, action_code, action_label
        FROM portfolio_advice_snapshots
        WHERE user_id = ? AND code = ?
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (user_id, clean),
    ).fetchone()
    payload = {
        "code": item.get("code"),
        "name": item.get("name"),
        "industry": item.get("industry"),
        "action": action,
        "stance": engine.get("stance"),
        "score": engine.get("total"),
        "summary": engine.get("summary"),
        "risk": engine.get("risk"),
        "nextActions": engine.get("nextActions", []),
        "triggers": engine.get("triggers", []),
        "riskProfile": risk_profile,
        "holdingContext": engine.get("holdingContext", {}),
        "positionAdvice": item.get("positionAdvice"),
        "modelVersion": engine.get("version") or ADVICE_MODEL_VERSION,
    }
    snapshot_id = secrets.token_hex(12)
    db.execute(
        """
        INSERT INTO portfolio_advice_snapshots (
          id, user_id, code, model_version, action_code, action_label, score, risk_level,
          position_ratio, total_gain_rate, payload, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """,
        (
            snapshot_id,
            user_id,
            clean,
            str(engine.get("version") or ADVICE_MODEL_VERSION),
            action_code,
            action_label,
            int(engine.get("total") or 0),
            str(risk_profile.get("level") or DEFAULT_USER_PROFILE["riskLevel"]),
            float(item.get("positionRatio") or 0),
            float(item.get("totalGainRate") or 0),
            to_json(payload),
        ),
    )
    if previous and previous["action_code"] != action_code:
        event = build_advice_change_alert_event(
            item=item,
            previous_action=str(previous["action_label"] or previous["action_code"]),
            next_action=action_label,
            snapshot_id=snapshot_id,
        )
        insert_alert_event(db, event, user_id=user_id)


def portfolio_advice_history_snapshot(
    user_id: str | None = None,
    code: str | None = None,
    limit: int = 30,
) -> list[dict[str, Any]]:
    owner_id = user_id or current_user_id()
    safe_limit = min(max(int(limit or 30), 1), 100)
    clean = clean_code(code) if code else None
    with connect() as db:
        if clean:
            rows = db.execute(
                """
                SELECT * FROM portfolio_advice_snapshots
                WHERE user_id = ? AND code = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (owner_id, clean, safe_limit),
            ).fetchall()
        else:
            rows = db.execute(
                """
                SELECT * FROM portfolio_advice_snapshots
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (owner_id, safe_limit),
            ).fetchall()
    return [portfolio_advice_snapshot_row(row) for row in rows]


def backtest_hit_for_action(action_code: str, return_pct: float) -> bool | None:
    bullish_actions = {"hold", "hold_or_add", "watch_buy"}
    defensive_actions = {"reduce", "no_add", "avoid"}
    if action_code in bullish_actions:
        return return_pct >= 0
    if action_code in defensive_actions:
        return return_pct <= 0
    return None


def stock_daily_rows_ascending(code: str) -> list[dict[str, Any]]:
    with connect() as db:
        rows = db.execute(
            """
            SELECT trade_date, close
            FROM stock_daily_snapshots
            WHERE code = ?
            ORDER BY trade_date ASC
            """,
            (clean_code(code),),
        ).fetchall()
    return [dict(row) for row in rows]


def compute_advice_backtest_result(
    advice: dict[str, Any],
    rows: list[dict[str, Any]],
    horizon_days: int,
) -> dict[str, Any]:
    entry_date = compact_date_from_datetime(advice.get("createdAt"))
    action_code = str(advice.get("actionCode") or "")
    if not rows:
        return {
            "horizonDays": horizon_days,
            "entryDate": entry_date,
            "targetDate": None,
            "entryPrice": None,
            "targetPrice": None,
            "returnPct": None,
            "hit": None,
            "status": "pending",
            "reason": "暂无日K快照，等待行情沉淀。",
        }

    entry_index = None
    for index, row in enumerate(rows):
        if str(row["trade_date"]) <= entry_date:
            entry_index = index
        else:
            break
    if entry_index is None:
        entry_index = 0
    target_index = entry_index + horizon_days
    entry_row = rows[entry_index]
    entry_price = round(float(entry_row["close"] or 0), 2)
    if target_index >= len(rows):
        return {
            "horizonDays": horizon_days,
            "entryDate": str(entry_row["trade_date"]),
            "targetDate": None,
            "entryPrice": entry_price,
            "targetPrice": None,
            "returnPct": None,
            "hit": None,
            "status": "pending",
            "reason": f"还没有足够的 {horizon_days} 个交易日结果。",
        }

    target_row = rows[target_index]
    target_price = round(float(target_row["close"] or 0), 2)
    result_pct = pct_change(entry_price, target_price)
    hit = backtest_hit_for_action(action_code, result_pct)
    return {
        "horizonDays": horizon_days,
        "entryDate": str(entry_row["trade_date"]),
        "targetDate": str(target_row["trade_date"]),
        "entryPrice": entry_price,
        "targetPrice": target_price,
        "returnPct": result_pct,
        "hit": hit,
        "status": "ready",
        "reason": "已根据日K快照完成回测。",
    }


def record_advice_backtest(
    db: sqlite3.Connection,
    *,
    advice: dict[str, Any],
    result: dict[str, Any],
) -> None:
    db.execute(
        """
        INSERT INTO portfolio_advice_backtests (
          id, advice_id, user_id, code, horizon_days, entry_date, target_date,
          entry_price, target_price, return_pct, hit, status, payload, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(advice_id, horizon_days) DO UPDATE SET
          target_date = excluded.target_date,
          entry_price = excluded.entry_price,
          target_price = excluded.target_price,
          return_pct = excluded.return_pct,
          hit = excluded.hit,
          status = excluded.status,
          payload = excluded.payload,
          updated_at = CURRENT_TIMESTAMP
        """,
        (
            secrets.token_hex(12),
            advice["id"],
            advice["userId"],
            advice["code"],
            int(result["horizonDays"]),
            result["entryDate"],
            result.get("targetDate"),
            result.get("entryPrice"),
            result.get("targetPrice"),
            result.get("returnPct"),
            None if result.get("hit") is None else (1 if result.get("hit") else 0),
            result["status"],
            to_json(result),
        ),
    )


def run_portfolio_advice_backtests(
    user_id: str | None = None,
    code: str | None = None,
    limit: int = 200,
) -> dict[str, Any]:
    owner_id = user_id or current_user_id()
    advice_items = portfolio_advice_history_snapshot(owner_id, code=code, limit=limit)
    rows_by_code: dict[str, list[dict[str, Any]]] = {}
    evaluated = 0
    ready = 0
    pending = 0
    with connect() as db:
        for advice in advice_items:
            rows = rows_by_code.setdefault(advice["code"], stock_daily_rows_ascending(advice["code"]))
            for horizon in (1, 5, 20):
                result = compute_advice_backtest_result(advice, rows, horizon)
                record_advice_backtest(db, advice=advice, result=result)
                evaluated += 1
                if result["status"] == "ready":
                    ready += 1
                else:
                    pending += 1
    return {
        "userId": owner_id,
        "code": clean_code(code) if code else None,
        "adviceCount": len(advice_items),
        "evaluated": evaluated,
        "ready": ready,
        "pending": pending,
        "updatedAt": now_text(),
    }


def portfolio_advice_backtest_row(row: sqlite3.Row) -> dict[str, Any]:
    payload: Any = {}
    with suppress(Exception):
        payload = from_json(row["payload"])
    if not isinstance(payload, dict):
        payload = {}
    stock = STOCKS.get(row["code"]) or {}
    return {
        "id": row["id"],
        "adviceId": row["advice_id"],
        "userId": row["user_id"],
        "code": row["code"],
        "name": stock.get("name", row["code"]),
        "horizonDays": int(row["horizon_days"] or 0),
        "entryDate": row["entry_date"],
        "targetDate": row["target_date"],
        "entryPrice": row["entry_price"],
        "targetPrice": row["target_price"],
        "returnPct": row["return_pct"],
        "hit": None if row["hit"] is None else bool(row["hit"]),
        "status": row["status"],
        "payload": payload,
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def portfolio_advice_backtest_snapshot(
    user_id: str | None = None,
    code: str | None = None,
    limit: int = 60,
) -> dict[str, Any]:
    owner_id = user_id or current_user_id()
    safe_limit = min(max(int(limit or 60), 1), 200)
    clean = clean_code(code) if code else None
    with connect() as db:
        if clean:
            rows = db.execute(
                """
                SELECT * FROM portfolio_advice_backtests
                WHERE user_id = ? AND code = ?
                ORDER BY updated_at DESC
                LIMIT ?
                """,
                (owner_id, clean, safe_limit),
            ).fetchall()
        else:
            rows = db.execute(
                """
                SELECT * FROM portfolio_advice_backtests
                WHERE user_id = ?
                ORDER BY updated_at DESC
                LIMIT ?
                """,
                (owner_id, safe_limit),
            ).fetchall()
    items = [portfolio_advice_backtest_row(row) for row in rows]
    ready_items = [item for item in items if item["status"] == "ready"]
    scored_items = [item for item in ready_items if item["hit"] is not None]
    hit_count = sum(1 for item in scored_items if item["hit"])
    return {
        "userId": owner_id,
        "code": clean,
        "summary": {
            "total": len(items),
            "ready": len(ready_items),
            "pending": sum(1 for item in items if item["status"] != "ready"),
            "scored": len(scored_items),
            "hitRate": round(hit_count / len(scored_items) * 100, 2) if scored_items else None,
        },
        "items": items,
    }


def normalize_portfolio_lot(amount: float, shares: int, cost_price: float, current_price: float) -> tuple[int, float]:
    safe_amount = float(amount or 0)
    safe_shares = int(shares or 0)
    safe_cost = float(cost_price or 0)
    safe_current = float(current_price or 0)
    if safe_current > 0 and (safe_shares <= 0 or safe_amount > safe_current * max(safe_shares, 1) * 3):
        safe_shares = max(1, int(safe_amount / safe_current))
    if safe_cost <= 0 or (safe_current > 0 and safe_cost > safe_current * 3):
        safe_cost = round(safe_amount / safe_shares, 2) if safe_shares else safe_current
    return safe_shares, safe_cost


def get_portfolio_lot(db: sqlite3.Connection, user_id: str, code: str) -> dict[str, Any]:
    clean = clean_code(code)
    stock = get_stock_or_404(clean)
    current_price = stock_price_number(stock)
    row = db.execute(
        "SELECT amount, shares, cost_price FROM portfolio WHERE code = ? AND user_id = ?",
        (clean, user_id),
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="portfolio holding not found")
    amount = float(row["amount"] or 0)
    shares, cost_price = normalize_portfolio_lot(
        amount,
        int(row["shares"] or 0),
        float(row["cost_price"] or 0),
        current_price,
    )
    return {
        "code": clean,
        "stock": stock,
        "amount": round(cost_price * shares, 2),
        "shares": shares,
        "costPrice": cost_price,
        "currentPrice": current_price,
    }


def portfolio_transactions_snapshot(
    user_id: str | None = None,
    code: str | None = None,
    limit: int = 30,
) -> list[dict[str, Any]]:
    owner_id = user_id or current_user_id()
    safe_limit = min(max(int(limit or 30), 1), 100)
    with connect() as db:
        if code:
            rows = db.execute(
                """
                SELECT id, user_id, code, action, amount, shares, price, note, created_at
                FROM portfolio_transactions
                WHERE user_id = ? AND code = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (owner_id, clean_code(code), safe_limit),
            ).fetchall()
        else:
            rows = db.execute(
                """
                SELECT id, user_id, code, action, amount, shares, price, note, created_at
                FROM portfolio_transactions
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (owner_id, safe_limit),
            ).fetchall()
    return [portfolio_transaction_row(row) for row in rows]


def portfolio_snapshot(
    user_id: str | None = None,
    refresh_quotes: bool = False,
    record_advice: bool = False,
) -> dict[str, Any]:
    owner_id = user_id or current_user_id()
    profile = user_profile_show(owner_id)
    with connect() as db:
        rows = db.execute(
            "SELECT code, amount, shares, cost_price FROM portfolio WHERE user_id = ? ORDER BY updated_at DESC",
            (owner_id,),
        ).fetchall()
        transaction_rows = db.execute(
            """
            SELECT id, user_id, code, action, amount, shares, price, note, created_at
            FROM portfolio_transactions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 20
            """,
            (owner_id,),
        ).fetchall()
    recent_transactions = [portfolio_transaction_row(row) for row in transaction_rows]
    latest_by_code = {}
    for transaction in recent_transactions:
        latest_by_code.setdefault(transaction["code"], transaction)
    quote_refresh = refresh_cached_quotes(
        [row["code"] for row in rows],
        allow_network=refresh_quotes,
    ) if rows else {
        "mode": "empty",
        "source": "portfolio",
        "message": "暂无持仓股票。",
        "refreshedCodes": [],
        "cacheHit": True,
    }
    items = []
    for row in rows:
        stock = apply_analysis_score(apply_snapshot_history(get_stock_or_404(row["code"])))
        current_price = stock_price_number(stock)
        amount = float(row["amount"] or 0)
        shares, cost_price = normalize_portfolio_lot(
            amount,
            int(row["shares"] or 0),
            float(row["cost_price"] or 0),
            current_price,
        )
        cost_amount = round(cost_price * shares, 2)
        market_value = round(current_price * shares, 2)
        day_gain = round(market_value * stock["performance"]["day"] / 100, 2)
        total_gain = round(market_value - cost_amount, 2)
        total_gain_rate = round(total_gain / cost_amount * 100, 2) if cost_amount else 0
        items.append(
            {
                "code": stock["code"],
                "name": stock["name"],
                "industry": stock["industry"],
                "amount": cost_amount,
                "shares": shares,
                "costPrice": round(cost_price, 2),
                "currentPrice": current_price,
                "marketValue": market_value,
                "dayGain": day_gain,
                "totalGain": total_gain,
                "totalGainRate": total_gain_rate,
                "stock": stock,
                "lastTransaction": latest_by_code.get(stock["code"]),
            }
        )
    total_cost = round(sum(item["amount"] for item in items), 2)
    total_market_value = round(sum(item["marketValue"] for item in items), 2)
    industry_totals: dict[str, float] = {}
    for item in items:
        industry_totals[item["industry"]] = industry_totals.get(item["industry"], 0) + item["marketValue"]
    for item in items:
        item["positionRatio"] = round(item["marketValue"] / total_market_value * 100, 2) if total_market_value else 0
        industry_ratio = round(industry_totals.get(item["industry"], 0) / total_market_value * 100, 2) if total_market_value else 0
        advice_engine = build_stock_advice_engine(
            item["stock"],
            holding=item,
            concentration_ratio=industry_ratio,
            risk_level=profile["riskLevel"],
        )
        item["adviceEngine"] = advice_engine
        item["positionAdvice"] = f"{advice_engine['stance']}。{advice_engine['summary']}。主要风险：{advice_engine['risk']}"
        item["stock"]["analysisScore"] = {
            **item["stock"].get("analysisScore", {}),
            "advice": advice_engine,
            "stance": advice_engine["stance"],
        }
    if record_advice and items:
        with connect() as db:
            for item in items:
                record_portfolio_advice_snapshot(db, user_id=owner_id, item=item)
    total_gain = round(sum(item["totalGain"] for item in items), 2)
    return {
        "userId": owner_id,
        "riskProfile": risk_profile_rules(profile["riskLevel"]),
        "items": items,
        "totalAmount": total_market_value,
        "totalCost": total_cost,
        "dayGain": round(sum(item["dayGain"] for item in items), 2),
        "totalGain": total_gain,
        "totalGainRate": round(total_gain / total_cost * 100, 2) if total_cost else 0,
        "recentTransactions": recent_transactions,
        "quoteRefresh": quote_refresh,
    }


def portfolio_insights(snapshot: dict[str, Any] | None = None) -> dict[str, Any]:
    data = snapshot or portfolio_snapshot(refresh_quotes=False)
    items = data.get("items", [])
    transactions = data.get("recentTransactions", [])
    total_market_value = float(data.get("totalAmount") or 0)
    total_gain = float(data.get("totalGain") or 0)
    day_gain = float(data.get("dayGain") or 0)

    industry_totals: dict[str, float] = {}
    for item in items:
        industry = item.get("industry") or "未分类"
        industry_totals[industry] = industry_totals.get(industry, 0) + float(item.get("marketValue") or 0)
    industry_buckets = [
        {
            "name": industry,
            "marketValue": round(value, 2),
            "ratio": round(value / total_market_value * 100, 2) if total_market_value else 0,
        }
        for industry, value in sorted(industry_totals.items(), key=lambda pair: pair[1], reverse=True)
    ]
    top_bucket = industry_buckets[0] if industry_buckets else {"name": "暂无", "marketValue": 0, "ratio": 0}
    top_holding = max(items, key=lambda item: float(item.get("marketValue") or 0), default=None)
    weak_holding = min(items, key=lambda item: float(item.get("totalGainRate") or 0), default=None)
    largest_loss = min(items, key=lambda item: float(item.get("totalGain") or 0), default=None)
    largest_profit = max(items, key=lambda item: float(item.get("totalGain") or 0), default=None)
    weighted_day_volatility = sum(
        abs(float(item.get("performance", {}).get("day", 0) or 0)) * float(item.get("positionRatio") or 0) / 100
        for item in items
    )
    diversification_score = round(max(0, min(100, 100 - max(0, top_bucket["ratio"] - 25) * 1.1 - max(0, (top_holding or {}).get("positionRatio", 0) - 25) * 0.9)))
    max_drawdown_estimate = round(
        min(45, weighted_day_volatility * 2.8 + max(0, top_bucket["ratio"] - 40) * 0.12 + max(0, float(data.get("totalGainRate") or 0) * -0.35)),
        2,
    )
    correlation_level = "高" if top_bucket["ratio"] >= 60 else "中" if top_bucket["ratio"] >= 40 else "低"
    actions = {action: 0 for action in ("buy", "sell", "adjust", "remove")}
    for transaction in transactions:
        action = transaction.get("action")
        actions[action] = actions.get(action, 0) + 1

    action_items: list[dict[str, str]] = []
    if not items:
        action_items.append({
            "level": "start",
            "title": "先添加持仓",
            "text": "添加股票和成本后，系统才能生成组合建议。",
        })
    if top_bucket["ratio"] >= 60:
        action_items.append({
            "level": "risk",
            "title": "分类过于集中",
            "text": f"{top_bucket['name']} 占比 {top_bucket['ratio']:.0f}%，新增资金先不要继续集中到这个方向。",
        })
    elif top_bucket["ratio"] >= 40:
        action_items.append({
            "level": "watch",
            "title": "关注分类集中度",
            "text": f"{top_bucket['name']} 是第一大分类，占比 {top_bucket['ratio']:.0f}%，加仓前先看其他方向。",
        })
    if top_holding and float(top_holding.get("positionRatio") or 0) >= 40:
        action_items.append({
            "level": "risk",
            "title": "单只股票影响较大",
            "text": f"{top_holding['name']} 仓位 {top_holding['positionRatio']:.0f}%，它会明显影响组合体验。",
        })
    if weak_holding and float(weak_holding.get("totalGainRate") or 0) <= -8:
        action_items.append({
            "level": "review",
            "title": "复盘亏损持仓",
            "text": f"{weak_holding['name']} 累计收益率 {weak_holding['totalGainRate']:.2f}%，需要确认是否还符合原来的持仓理由。",
        })
    if not action_items:
        action_items.append({
            "level": "normal",
            "title": "组合暂时平稳",
            "text": "当前没有明显单点风险，继续跟踪趋势、公告和仓位变化。",
        })

    risk_score = 100
    risk_score -= max(0, top_bucket["ratio"] - 35) * 0.8
    if top_holding:
        risk_score -= max(0, float(top_holding.get("positionRatio") or 0) - 30) * 0.7
    risk_score -= max_drawdown_estimate * 0.35
    if total_gain < 0:
        risk_score -= min(18, abs(float(data.get("totalGainRate") or 0)) * 0.8)
    risk_score = round(max(35, min(95, risk_score)))
    if risk_score >= 78:
        risk_label = "结构健康"
    elif risk_score >= 60:
        risk_label = "需要观察"
    else:
        risk_label = "风险偏高"

    return {
        "userId": data.get("userId"),
        "riskScore": risk_score,
        "riskLabel": risk_label,
        "summary": {
            "holdingCount": len(items),
            "totalMarketValue": round(total_market_value, 2),
            "dayGain": round(day_gain, 2),
            "totalGain": round(total_gain, 2),
            "totalGainRate": data.get("totalGainRate", 0),
        },
        "concentration": {
            "topIndustry": top_bucket["name"],
            "topRatio": top_bucket["ratio"],
            "buckets": industry_buckets[:6],
        },
        "topHolding": {
            "code": top_holding.get("code"),
            "name": top_holding.get("name"),
            "positionRatio": top_holding.get("positionRatio"),
            "marketValue": top_holding.get("marketValue"),
        } if top_holding else None,
        "transactionStats": {
            "recentCount": len(transactions),
            "actions": actions,
            "latest": transactions[:5],
        },
        "riskEngine": {
            "version": "portfolio-risk-v2",
            "diversificationScore": diversification_score,
            "estimatedMaxDrawdown": max_drawdown_estimate,
            "weightedDayVolatility": round(weighted_day_volatility, 2),
            "correlationLevel": correlation_level,
            "profitContribution": {
                "largestProfit": {
                    "code": largest_profit.get("code"),
                    "name": largest_profit.get("name"),
                    "amount": round(float(largest_profit.get("totalGain") or 0), 2),
                } if largest_profit else None,
                "largestLoss": {
                    "code": largest_loss.get("code"),
                    "name": largest_loss.get("name"),
                    "amount": round(float(largest_loss.get("totalGain") or 0), 2),
                } if largest_loss else None,
            },
            "notes": [
                f"当前相关性风险为{correlation_level}，主要由{top_bucket['name']}占比决定。",
                f"估算最大回撤约 {max_drawdown_estimate}%，用于提醒仓位压力，不代表真实最大亏损。",
                f"分散度评分 {diversification_score}，越高代表行业和单股暴露越均衡。",
            ],
        },
        "actionItems": action_items[:4],
        "quoteRefresh": data.get("quoteRefresh"),
    }


@app.get("/api/portfolio")
def portfolio_index(refresh: bool = False) -> dict[str, Any]:
    return portfolio_snapshot(refresh_quotes=refresh, record_advice=True)


@app.get("/api/portfolio/insights")
def portfolio_insights_index(refresh: bool = False) -> dict[str, Any]:
    return portfolio_insights(portfolio_snapshot(refresh_quotes=refresh))


@app.get("/api/portfolio/transactions")
def portfolio_transactions_index(limit: int = 30) -> dict[str, Any]:
    owner_id = current_user_id()
    return {
        "userId": owner_id,
        "items": portfolio_transactions_snapshot(owner_id, limit=limit),
    }


@app.get("/api/portfolio/advice-history")
def portfolio_advice_history_index(limit: int = 30) -> dict[str, Any]:
    owner_id = current_user_id()
    return {
        "userId": owner_id,
        "items": portfolio_advice_history_snapshot(owner_id, limit=limit),
    }


@app.post("/api/portfolio/advice-backtests/run")
def portfolio_advice_backtests_run(code: str | None = None, limit: int = 200) -> dict[str, Any]:
    return run_portfolio_advice_backtests(code=code, limit=limit)


@app.get("/api/portfolio/advice-backtests")
def portfolio_advice_backtests_index(code: str | None = None, limit: int = 60) -> dict[str, Any]:
    return portfolio_advice_backtest_snapshot(code=code, limit=limit)


@app.get("/api/portfolio/{code}/transactions")
def portfolio_stock_transactions_index(code: str, limit: int = 30) -> dict[str, Any]:
    owner_id = current_user_id()
    clean = clean_code(code)
    stock = get_stock_or_404(clean)
    return {
        "userId": owner_id,
        "code": clean,
        "name": stock["name"],
        "items": portfolio_transactions_snapshot(owner_id, code=clean, limit=limit),
    }


@app.get("/api/portfolio/{code}/advice-history")
def portfolio_stock_advice_history_index(code: str, limit: int = 30) -> dict[str, Any]:
    owner_id = current_user_id()
    clean = clean_code(code)
    stock = get_stock_or_404(clean)
    return {
        "userId": owner_id,
        "code": clean,
        "name": stock["name"],
        "items": portfolio_advice_history_snapshot(owner_id, code=clean, limit=limit),
    }


@app.post("/api/portfolio", status_code=201)
def portfolio_upsert(payload: PortfolioPayload) -> dict[str, Any]:
    code = clean_code(payload.code)
    stock = get_stock_or_404(code)
    owner_id = current_user_id()
    current_price = stock_price_number(stock)
    cost_price = float(payload.costPrice or current_price)
    shares = int(payload.shares or 0)
    amount = float(payload.amount or 0)
    if shares <= 0 and amount > 0 and cost_price > 0:
        shares = max(1, int(amount / cost_price))
    if amount <= 0 and shares > 0:
        amount = shares * cost_price
    if amount <= 0 or shares <= 0:
        raise HTTPException(status_code=422, detail="amount or shares is required")
    with connect() as db:
        existing = db.execute(
            "SELECT amount, shares, cost_price FROM portfolio WHERE code = ? AND user_id = ?",
            (code, owner_id),
        ).fetchone()
        if existing:
            existing_amount = float(existing["amount"] or 0)
            existing_shares, existing_cost = normalize_portfolio_lot(
                existing_amount,
                int(existing["shares"] or 0),
                float(existing["cost_price"] or 0),
                current_price,
            )
            next_amount = round((existing_cost * existing_shares) + amount, 2)
            next_shares = existing_shares + shares
            next_cost = round(next_amount / next_shares, 2) if next_shares else cost_price
            db.execute(
                """
                UPDATE portfolio
                SET amount = ?, shares = ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP
                WHERE code = ? AND user_id = ?
                """,
                (next_amount, next_shares, next_cost, code, owner_id),
            )
        else:
            db.execute(
                """
                INSERT INTO portfolio (code, user_id, amount, shares, cost_price, updated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """,
                (code, owner_id, round(amount, 2), shares, round(cost_price, 2)),
            )
        record_portfolio_transaction(
            db,
            user_id=owner_id,
            code=code,
            action="buy",
            amount=amount,
            shares=shares,
            price=cost_price,
            note=payload.note or "加入持仓",
        )
    return portfolio_snapshot(refresh_quotes=False, record_advice=True)


@app.post("/api/portfolio/{code}/sell")
def portfolio_sell(code: str, payload: PortfolioSellPayload) -> dict[str, Any]:
    owner_id = current_user_id()
    clean = clean_code(code)
    stock = get_stock_or_404(clean)
    current_price = stock_price_number(stock)
    sell_price = float(payload.price or current_price)
    if sell_price <= 0:
        raise HTTPException(status_code=422, detail="price is required")
    with connect() as db:
        lot = get_portfolio_lot(db, owner_id, clean)
        holding_shares = int(lot["shares"] or 0)
        sell_shares = int(payload.shares or 0)
        if sell_shares <= 0 and payload.amount:
            sell_shares = max(1, int(float(payload.amount) / sell_price))
        if sell_shares <= 0:
            raise HTTPException(status_code=422, detail="shares or amount is required")
        if sell_shares > holding_shares:
            raise HTTPException(status_code=422, detail="sell shares exceeds holding shares")
        sell_amount = round(sell_shares * sell_price, 2)
        next_shares = holding_shares - sell_shares
        next_amount = round(float(lot["costPrice"]) * next_shares, 2)
        if next_shares <= 0:
            db.execute("DELETE FROM portfolio WHERE code = ? AND user_id = ?", (clean, owner_id))
        else:
            db.execute(
                """
                UPDATE portfolio
                SET amount = ?, shares = ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP
                WHERE code = ? AND user_id = ?
                """,
                (next_amount, next_shares, round(float(lot["costPrice"]), 2), clean, owner_id),
            )
        record_portfolio_transaction(
            db,
            user_id=owner_id,
            code=clean,
            action="sell",
            amount=sell_amount,
            shares=sell_shares,
            price=sell_price,
            note=payload.note or "卖出/减仓",
        )
    return portfolio_snapshot(refresh_quotes=False, record_advice=True)


@app.patch("/api/portfolio/{code}")
def portfolio_update(code: str, payload: PortfolioUpdatePayload) -> dict[str, Any]:
    owner_id = current_user_id()
    clean = clean_code(code)
    with connect() as db:
        lot = get_portfolio_lot(db, owner_id, clean)
        next_shares = int(payload.shares or lot["shares"])
        next_cost_price = float(payload.costPrice or lot["costPrice"])
        next_amount = float(payload.amount or (next_shares * next_cost_price))
        if next_shares <= 0 or next_cost_price <= 0 or next_amount <= 0:
            raise HTTPException(status_code=422, detail="valid shares, costPrice or amount is required")
        if payload.amount and not payload.costPrice:
            next_cost_price = round(next_amount / next_shares, 2)
        db.execute(
            """
            UPDATE portfolio
            SET amount = ?, shares = ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP
            WHERE code = ? AND user_id = ?
            """,
            (round(next_amount, 2), next_shares, round(next_cost_price, 2), clean, owner_id),
        )
        record_portfolio_transaction(
            db,
            user_id=owner_id,
            code=clean,
            action="adjust",
            amount=next_amount,
            shares=next_shares,
            price=next_cost_price,
            note=payload.note or "修改持仓成本",
        )
    return portfolio_snapshot(refresh_quotes=False, record_advice=True)


@app.delete("/api/portfolio/{code}")
def portfolio_delete(code: str) -> dict[str, Any]:
    owner_id = current_user_id()
    clean = clean_code(code)
    with connect() as db:
        row = db.execute(
            "SELECT code, amount, shares, cost_price FROM portfolio WHERE code = ? AND user_id = ?",
            (clean, owner_id),
        ).fetchone()
        if row:
            record_portfolio_transaction(
                db,
                user_id=owner_id,
                code=clean,
                action="remove",
                amount=float(row["amount"] or 0),
                shares=int(row["shares"] or 0),
                price=float(row["cost_price"] or 0),
                note="移出持仓",
            )
        db.execute("DELETE FROM portfolio WHERE code = ? AND user_id = ?", (clean, owner_id))
    return portfolio_snapshot(refresh_quotes=False, record_advice=True)


@app.get("/api/alerts/settings")
def alert_settings_show() -> dict[str, Any]:
    owner_id = current_user_id()
    with connect() as db:
        row = db.execute("SELECT payload FROM app_settings WHERE key = ?", (alert_settings_key(owner_id),)).fetchone()
        if not row:
            row = db.execute("SELECT payload FROM app_settings WHERE key = ?", ("alerts",)).fetchone()
    return normalize_alert_settings(from_json(row["payload"]) if row else None)


@app.post("/api/alerts/settings")
def alert_settings_update(payload: AlertSettingsPayload) -> dict[str, Any]:
    data = payload.model_dump()
    owner_id = current_user_id()
    with connect() as db:
        db.execute(
            """
            INSERT INTO app_settings (key, payload)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET payload = excluded.payload
            """,
            (alert_settings_key(owner_id), to_json(data)),
        )
    return data


@app.get("/api/alerts/events")
def alert_events_index() -> dict[str, Any]:
    settings = alert_settings_show()
    owner_id = current_user_id()
    if not settings.get("enabled"):
        return {
            "updated": now_text(),
            "events": [],
            "status": get_alert_monitor_status(),
            "unreadCount": unread_alert_count(owner_id),
        }
    return {
        "updated": now_text(),
        "events": list_alert_events(user_id=owner_id),
        "status": get_alert_monitor_status(),
        "unreadCount": unread_alert_count(owner_id),
    }


@app.post("/api/alerts/check")
def alert_events_check() -> dict[str, Any]:
    result = run_alert_check("manual")
    owner_id = current_user_id()
    return {
        "updated": now_text(),
        "checked": result["status"]["lastEventCount"],
        "events": result["events"],
        "status": result["status"],
        "unreadCount": unread_alert_count(owner_id),
    }


@app.get("/api/alerts/status")
def alert_monitor_status_show() -> dict[str, Any]:
    return get_alert_monitor_status()


@app.post("/api/alerts/read")
def alert_events_mark_read() -> dict[str, Any]:
    return mark_alert_events_read()


@app.post("/api/alerts/{event_id}/read")
def alert_event_mark_read(event_id: str) -> dict[str, Any]:
    return mark_alert_events_read(event_id)
