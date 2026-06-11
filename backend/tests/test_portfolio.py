from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_backend():
    spec = importlib.util.spec_from_file_location("gujing_backend", ROOT / "main.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class PortfolioFlowTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.backend = load_backend()
        self.backend.DB_PATH = Path(self.temp_dir.name) / "test-gujing.db"
        self.backend.init_db()
        with self.backend.connect() as db:
            db.execute(
                "DELETE FROM portfolio WHERE user_id = ? AND code = ?",
                (self.backend.DEFAULT_USER_ID, "000001"),
            )
            db.execute(
                "DELETE FROM portfolio_transactions WHERE user_id = ? AND code = ?",
                (self.backend.DEFAULT_USER_ID, "000001"),
            )
            db.execute(
                "DELETE FROM portfolio_advice_snapshots WHERE user_id = ? AND code = ?",
                (self.backend.DEFAULT_USER_ID, "000001"),
            )
            db.execute(
                "DELETE FROM portfolio_advice_backtests WHERE user_id = ? AND code = ?",
                (self.backend.DEFAULT_USER_ID, "000001"),
            )

    def tearDown(self):
        self.temp_dir.cleanup()

    def holding(self, snapshot, code="000001"):
        return next((item for item in snapshot["items"] if item["code"] == code), None)

    def transaction_actions(self, code="000001", limit=10):
        return [
            item["action"]
            for item in self.backend.portfolio_transactions_snapshot(
                self.backend.DEFAULT_USER_ID,
                code=code,
                limit=limit,
            )
        ]

    def test_buy_adjust_sell_and_remove_records_transactions(self):
        created = self.backend.portfolio_upsert(
            self.backend.PortfolioPayload(
                code="000001",
                amount=2000,
                costPrice=10,
                note="test buy",
            )
        )
        holding = self.holding(created)
        self.assertIsNotNone(holding)
        self.assertEqual(holding["shares"], 200)
        self.assertEqual(holding["costPrice"], 10)

        adjusted = self.backend.portfolio_update(
            "000001",
            self.backend.PortfolioUpdatePayload(
                shares=180,
                costPrice=10.5,
                note="test adjust",
            ),
        )
        holding = self.holding(adjusted)
        self.assertEqual(holding["shares"], 180)
        self.assertEqual(holding["costPrice"], 10.5)

        sold = self.backend.portfolio_sell(
            "000001",
            self.backend.PortfolioSellPayload(
                shares=10,
                price=10.8,
                note="test sell",
            ),
        )
        holding = self.holding(sold)
        self.assertEqual(holding["shares"], 170)

        removed = self.backend.portfolio_delete("000001")
        self.assertIsNone(self.holding(removed))

        self.assertEqual(
            self.transaction_actions(limit=4),
            ["buy", "adjust", "sell", "remove"],
        )

    def test_portfolio_holding_includes_personalized_action(self):
        snapshot = self.backend.portfolio_upsert(
            self.backend.PortfolioPayload(
                code="000001",
                amount=5000,
                costPrice=9,
                note="personalized advice test",
            )
        )
        holding = self.holding(snapshot)
        engine = holding["adviceEngine"]

        self.assertIn("action", engine)
        self.assertIn("label", engine["action"])
        self.assertIn("reason", engine["action"])
        self.assertIn("targetPosition", engine["action"])
        self.assertTrue(engine["nextActions"])
        self.assertIn("holdingContext", engine)
        self.assertEqual(engine["holdingContext"]["positionRatio"], holding["positionRatio"])
        self.assertTrue(any(rule["name"] == "预测" for rule in engine["rules"]))

    def test_risk_profile_changes_holding_advice_context(self):
        self.backend.user_profile_update(
            self.backend.UserProfilePayload(
                displayName="Risk Test",
                riskLevel="进取",
                defaultMarket="A股",
            )
        )
        snapshot = self.backend.portfolio_upsert(
            self.backend.PortfolioPayload(
                code="000001",
                amount=5000,
                costPrice=10,
                note="risk profile test",
            )
        )
        holding = self.holding(snapshot)
        engine = holding["adviceEngine"]

        self.assertEqual(snapshot["riskProfile"]["label"], "进取")
        self.assertEqual(engine["riskProfile"]["level"], "进取")
        self.assertEqual(engine["riskProfile"]["heavyPosition"], 45)
        self.assertIn("targetPosition", engine["action"])

    def test_portfolio_advice_history_records_snapshots(self):
        self.backend.portfolio_upsert(
            self.backend.PortfolioPayload(
                code="000001",
                amount=5000,
                costPrice=10,
                note="advice history test",
            )
        )
        history = self.backend.portfolio_advice_history_snapshot(
            self.backend.DEFAULT_USER_ID,
            code="000001",
            limit=5,
        )

        self.assertTrue(history)
        latest = history[0]
        self.assertEqual(latest["code"], "000001")
        self.assertIn("actionLabel", latest)
        self.assertIn("payload", latest)
        self.assertIn("holdingContext", latest["payload"])
        self.assertIn("nextActions", latest["payload"])

    def test_advice_change_creates_alert_event(self):
        stock = self.backend.apply_analysis_score(self.backend.get_stock_or_404("000001"))
        base_item = {
            "code": "000001",
            "name": "平安银行",
            "industry": "银行",
            "positionRatio": 12,
            "totalGainRate": 3,
            "positionAdvice": "测试建议",
            "adviceEngine": {
                "total": 70,
                "stance": "正常持有",
                "summary": "测试",
                "risk": "测试",
                "riskProfile": {"level": "稳健"},
                "holdingContext": {},
                "nextActions": [],
                "triggers": [],
                "action": {
                    "code": "hold",
                    "label": "正常持有",
                    "reason": "测试初始建议。",
                },
            },
            "stock": stock,
        }
        changed_item = {
            **base_item,
            "positionRatio": 46,
            "adviceEngine": {
                **base_item["adviceEngine"],
                "total": 45,
                "stance": "建议控制仓位",
                "action": {
                    "code": "reduce",
                    "label": "降低仓位",
                    "reason": "仓位偏高，需要控制风险。",
                },
            },
        }
        with self.backend.connect() as db:
            self.backend.record_portfolio_advice_snapshot(
                db,
                user_id=self.backend.DEFAULT_USER_ID,
                item=base_item,
            )
            self.backend.record_portfolio_advice_snapshot(
                db,
                user_id=self.backend.DEFAULT_USER_ID,
                item=changed_item,
            )

        events = self.backend.list_alert_events(user_id=self.backend.DEFAULT_USER_ID)
        advice_events = [event for event in events if event["type"] == "advice-change"]

        self.assertTrue(advice_events)
        self.assertEqual(advice_events[0]["code"], "000001")
        self.assertIn("降低仓位", advice_events[0]["text"])

    def test_advice_backtests_evaluate_future_returns(self):
        self.backend.portfolio_upsert(
            self.backend.PortfolioPayload(
                code="000001",
                amount=5000,
                costPrice=10,
                note="backtest seed",
            )
        )
        with self.backend.connect() as db:
            advice = db.execute(
                """
                SELECT id FROM portfolio_advice_snapshots
                WHERE user_id = ? AND code = ?
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (self.backend.DEFAULT_USER_ID, "000001"),
            ).fetchone()
            self.assertIsNotNone(advice)
            db.execute(
                "UPDATE portfolio_advice_snapshots SET created_at = ? WHERE id = ?",
                ("2026-01-02 15:00:00", advice["id"]),
            )
            for index in range(30):
                date = f"202601{index + 1:02d}"
                close = 10 + index * 0.1
                db.execute(
                    """
                    INSERT OR REPLACE INTO stock_daily_snapshots (
                      code, trade_date, open, high, low, close, pre_close,
                      volume, amount, source, payload, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """,
                    (
                        "000001",
                        date,
                        close,
                        close + 0.05,
                        close - 0.05,
                        close,
                        close - 0.1,
                        1000,
                        10000,
                        "test",
                        "{}",
                    ),
                )

        result = self.backend.run_portfolio_advice_backtests(self.backend.DEFAULT_USER_ID, code="000001")
        snapshot = self.backend.portfolio_advice_backtest_snapshot(self.backend.DEFAULT_USER_ID, code="000001")

        self.assertEqual(result["evaluated"], 3)
        self.assertEqual(result["ready"], 3)
        self.assertEqual(snapshot["summary"]["total"], 3)
        self.assertEqual(snapshot["summary"]["ready"], 3)
        self.assertTrue(all(item["status"] == "ready" for item in snapshot["items"]))
        self.assertTrue(all(item["returnPct"] is not None for item in snapshot["items"]))

    def test_sell_more_than_holding_is_rejected(self):
        self.backend.portfolio_upsert(
            self.backend.PortfolioPayload(
                code="000001",
                amount=1000,
                costPrice=10,
            )
        )
        with self.assertRaises(self.backend.HTTPException) as error:
            self.backend.portfolio_sell(
                "000001",
                self.backend.PortfolioSellPayload(shares=999, price=10),
            )
        self.assertEqual(error.exception.status_code, 422)

    def test_fast_portfolio_snapshot_does_not_call_network_refresh(self):
        self.backend.portfolio_upsert(
            self.backend.PortfolioPayload(
                code="000001",
                amount=1000,
                costPrice=10,
            )
        )

        calls = []
        original_quote_refresh = self.backend.refresh_quote_data
        original_market_refresh = self.backend.refresh_market_data

        def fake_quote_refresh(codes=None):
            calls.append(codes)
            return {"mode": "live", "refreshedCodes": codes or []}

        def fail_market_refresh(codes=None):
            raise AssertionError("portfolio snapshot should not run full market refresh")

        self.backend.refresh_quote_data = fake_quote_refresh
        self.backend.refresh_market_data = fail_market_refresh
        try:
            fast_snapshot = self.backend.portfolio_snapshot(refresh_quotes=False)
            forced_snapshot = self.backend.portfolio_snapshot(refresh_quotes=True)
        finally:
            self.backend.refresh_quote_data = original_quote_refresh
            self.backend.refresh_market_data = original_market_refresh

        self.assertEqual(len(calls), 1)
        self.assertIn("000001", calls[0])
        self.assertIn(fast_snapshot["quoteRefresh"]["mode"], {"cache", "cache-stale"})
        self.assertEqual(forced_snapshot["quoteRefresh"]["mode"], "live")

    def test_portfolio_insights_include_risk_and_actions(self):
        snapshot = self.backend.portfolio_upsert(
            self.backend.PortfolioPayload(
                code="000001",
                amount=8000,
                costPrice=10,
                note="insight test buy",
            )
        )
        insights = self.backend.portfolio_insights(snapshot)

        self.assertIn("riskScore", insights)
        self.assertIn("riskLabel", insights)
        self.assertGreaterEqual(insights["riskScore"], 35)
        self.assertIn("concentration", insights)
        self.assertTrue(insights["concentration"]["buckets"])
        self.assertIn("transactionStats", insights)
        self.assertGreaterEqual(insights["transactionStats"]["actions"]["buy"], 1)
        self.assertIn("riskEngine", insights)
        self.assertIn("diversificationScore", insights["riskEngine"])
        self.assertIn("estimatedMaxDrawdown", insights["riskEngine"])
        self.assertTrue(insights["actionItems"])

    def test_search_supports_pinyin_initials(self):
        matches = self.backend.search_stocks("payh")
        self.assertTrue(matches)
        self.assertEqual(matches[0]["code"], "000001")

    def test_user_export_contains_portfolio_records(self):
        self.backend.portfolio_upsert(
            self.backend.PortfolioPayload(
                code="000001",
                amount=1000,
                costPrice=10,
                note="export test buy",
            )
        )
        payload = self.backend.user_export_payload(self.backend.DEFAULT_USER_ID)
        self.assertIn("exportedAt", payload)
        self.assertIn("profile", payload)
        self.assertIn("persona", payload)
        self.assertIn("portfolioInsights", payload)
        self.assertTrue(any(item["code"] == "000001" for item in payload["portfolio"]))
        self.assertTrue(any(item["code"] == "000001" for item in payload["transactions"]))
        self.assertTrue(any(item["code"] == "000001" for item in payload["adviceHistory"]))

    def test_delete_user_account_clears_personal_records(self):
        user_id = "phone_delete_test"
        token = self.backend.CURRENT_USER_ID.set(user_id)
        try:
            with self.backend.connect() as db:
                db.execute(
                    """
                    INSERT INTO users (id, display_name, risk_level, default_market, phone)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (user_id, "删除测试", "稳健", "A股", "15900000000"),
                )
                db.execute(
                    "INSERT INTO watchlist (code, user_id) VALUES (?, ?)",
                    ("000001", user_id),
                )
                db.execute(
                    "INSERT INTO app_settings (key, payload) VALUES (?, ?)",
                    (self.backend.alert_settings_key(user_id), self.backend.to_json(self.backend.DEFAULT_ALERT_SETTINGS)),
                )

            self.backend.portfolio_upsert(
                self.backend.PortfolioPayload(
                    code="000001",
                    amount=1000,
                    costPrice=10,
                    note="delete test buy",
                )
            )
            self.backend.record_recommendation_feedback("000001", "watch", "test", user_id=user_id)
            self.backend.build_user_persona(user_id)
            self.backend.save_alert_events([
                {
                    "id": "delete-test-alert",
                    "code": "000001",
                    "type": "price-move",
                    "severity": "medium",
                    "title": "测试提醒",
                    "text": "测试提醒内容",
                    "payload": {},
                    "createdAt": self.backend.now_text(),
                }
            ], user_id=user_id)

            result = self.backend.delete_user_account(user_id)
            self.assertTrue(result["ok"])

            with self.backend.connect() as db:
                checks = {
                    "users": db.execute("SELECT COUNT(*) AS count FROM users WHERE id = ?", (user_id,)).fetchone()["count"],
                    "watchlist": db.execute("SELECT COUNT(*) AS count FROM watchlist WHERE user_id = ?", (user_id,)).fetchone()["count"],
                    "portfolio": db.execute("SELECT COUNT(*) AS count FROM portfolio WHERE user_id = ?", (user_id,)).fetchone()["count"],
                    "transactions": db.execute("SELECT COUNT(*) AS count FROM portfolio_transactions WHERE user_id = ?", (user_id,)).fetchone()["count"],
                    "alerts": db.execute("SELECT COUNT(*) AS count FROM alert_events WHERE user_id = ?", (user_id,)).fetchone()["count"],
                    "feedback": db.execute("SELECT COUNT(*) AS count FROM recommendation_feedback WHERE user_id = ?", (user_id,)).fetchone()["count"],
                    "personas": db.execute("SELECT COUNT(*) AS count FROM user_personas WHERE user_id = ?", (user_id,)).fetchone()["count"],
                    "settings": db.execute("SELECT COUNT(*) AS count FROM app_settings WHERE key = ?", (self.backend.alert_settings_key(user_id),)).fetchone()["count"],
                }
            self.assertTrue(all(count == 0 for count in checks.values()), checks)
        finally:
            self.backend.CURRENT_USER_ID.reset(token)

    def test_user_persona_summarizes_feedback(self):
        self.backend.record_recommendation_feedback("000001", "analyze", "home")
        persona = self.backend.build_user_persona(self.backend.DEFAULT_USER_ID)

        self.assertIn("style", persona)
        self.assertIn("holdingStyle", persona)
        self.assertIn("actions", persona)
        self.assertGreaterEqual(persona["actions"].get("analyze", 0), 1)

    def test_task_run_health_tracks_failures(self):
        self.backend.record_task_run("market_universe", "test", "error", 12, {"error": "demo"}, "DemoError")
        health = self.backend.task_run_health("market_universe")

        self.assertEqual(health["consecutiveFailures"], 1)
        self.assertEqual(health["lastError"], "DemoError")

    def test_system_readiness_and_error_audit(self):
        self.backend.record_error_audit(
            path="/api/test",
            method="GET",
            status_code=500,
            message="TestError",
            user_id=self.backend.DEFAULT_USER_ID,
            ip="127.0.0.1",
        )
        readiness = self.backend.system_readiness_payload()
        errors = self.backend.recent_error_audit(limit=3)

        self.assertIn("checks", readiness)
        self.assertIn("database", readiness["checks"])
        self.assertTrue(readiness["checks"]["database"]["ok"])
        self.assertTrue(errors)
        self.assertEqual(errors[0]["message"], "TestError")

    def test_cached_news_uses_database_payload(self):
        original_fetch = self.backend.fetch_stock_news_impact

        def fake_fetch(code, limit=5):
            return {
                "stance": "消息面待观察",
                "items": [{"title": f"{code} 测试新闻", "tone": "neutral"}],
                "counts": {"positive": 0, "negative": 0, "watch": 1},
                "updated": self.backend.now_text(),
                "errors": [],
            }

        self.backend.fetch_stock_news_impact = fake_fetch
        try:
            fresh = self.backend.cached_stock_news_impact("000001", max_age_minutes=0)
            cached = self.backend.cached_stock_news_impact("000001", max_age_minutes=180)
        finally:
            self.backend.fetch_stock_news_impact = original_fetch

        self.assertEqual(fresh["cache"]["mode"], "fresh")
        self.assertEqual(cached["cache"]["mode"], "cached")
        self.assertTrue(cached["items"])

    def test_stock_forecast_outputs_probabilities(self):
        stock = self.backend.apply_analysis_score(self.backend.get_stock_or_404("000001"))
        analysis = stock["analysisScore"]
        forecast = analysis["forecast"]

        self.assertEqual(forecast["version"], self.backend.FORECAST_MODEL_VERSION)
        self.assertGreaterEqual(forecast["probability5d"], 0)
        self.assertLessEqual(forecast["probability5d"], 100)
        self.assertGreaterEqual(forecast["probability20d"], 0)
        self.assertLessEqual(forecast["probability20d"], 100)
        self.assertIn("riskScore", forecast)
        self.assertIn("confidence", forecast)
        self.assertIn("keyLevels", forecast)
        self.assertIn("watchPoints", forecast)
        self.assertIn("riskWarnings", forecast)
        self.assertIn("modelInputs", forecast)
        self.assertTrue(forecast["factors"])
        self.assertGreaterEqual(forecast["confidence"]["score"], 0)
        self.assertLessEqual(forecast["confidence"]["score"], 100)
        self.assertTrue(forecast["watchPoints"])
        self.assertIn("dataQuality", analysis)
        self.assertIn("compliance", analysis)
        self.assertIn("industryModel", analysis)
        self.assertEqual(analysis["modelVersion"], self.backend.ADVICE_MODEL_VERSION)
        self.assertEqual(analysis["advice"]["version"], self.backend.ADVICE_MODEL_VERSION)
        self.assertIn("label", analysis["dataQuality"])
        self.assertIn("sourceTrust", analysis["dataQuality"])
        self.assertIn("sourceTrust", analysis)
        self.assertIn("items", analysis["compliance"])
        self.assertIn("name", analysis["industryModel"])

    def test_recommendation_feedback_personalizes_scores(self):
        empty_summary = self.backend.recommendation_feedback_summary()
        without_feedback = self.backend.personalized_recommendation_score(
            self.backend.get_stock_or_404("000001"),
            empty_summary,
        )
        self.backend.record_recommendation_feedback("000001", "analyze", "home")
        summary = self.backend.recommendation_feedback_summary()
        preferred = self.backend.personalized_recommendation_score(
            self.backend.get_stock_or_404("000001"),
            summary,
        )

        self.assertGreater(preferred, without_feedback)
        self.assertIn("000001", summary["codeScores"])

    def test_today_recommendations_include_personalization_metadata(self):
        self.backend.save_data_status(
            {
                **self.backend.DEFAULT_DATA_STATUS,
                "mode": "live",
                "lastRefresh": self.backend.now_text(),
            }
        )
        self.backend.record_recommendation_feedback("000001", "analyze", "home")

        recommendations = self.backend.today_recommendation_payload(limit=3)

        self.assertTrue(recommendations)
        self.assertIn("recommendation", recommendations[0])
        self.assertEqual(
            recommendations[0]["recommendation"]["modelVersion"],
            self.backend.RECOMMENDATION_MODEL_VERSION,
        )

    def test_data_guard_blocks_clear_advice_when_data_missing(self):
        stock = {
            **self.backend.get_stock_or_404("000001"),
            "price": "0",
            "quoteStats": {},
            "klineRows": [],
            "dataCoverage": {"quote": False, "history": False, "fundamental": False},
        }
        engine = self.backend.build_stock_advice_engine(stock)

        self.assertTrue(engine["dataGuard"]["enabled"])
        self.assertEqual(engine["action"]["code"], "data_wait")

    def test_task_status_exposes_automation_settings(self):
        status = self.backend.list_task_statuses()

        self.assertIn("automation", status)
        self.assertTrue(status["automation"]["enabled"])
        self.assertIn("tasks", status)
        self.assertTrue(any(task["taskId"] == "alert_check" for task in status["tasks"]))


if __name__ == "__main__":
    unittest.main()
