from datetime import date
from decimal import Decimal
import unittest

from app.services.currency import convert_amount_to_rub, parse_cbr_daily_rates


CBR_XML = b"""<?xml version="1.0" encoding="windows-1251"?>
<ValCurs Date="22.08.2026" name="Foreign Currency Market">
  <Valute ID="R01235"><Nominal>1</Nominal><CharCode>USD</CharCode><Value>81,25</Value><VunitRate>81,25</VunitRate></Valute>
  <Valute ID="R01239"><Nominal>1</Nominal><CharCode>EUR</CharCode><Value>94,50</Value><VunitRate>94,50</VunitRate></Valute>
  <Valute ID="R01700J"><Nominal>10</Nominal><CharCode>TRY</CharCode><Value>19,50</Value><VunitRate>1,95</VunitRate></Valute>
</ValCurs>"""


class CurrencyServiceTests(unittest.TestCase):
    def test_parses_supported_cbr_rates_per_single_unit(self):
        rates, effective_date = parse_cbr_daily_rates(CBR_XML)

        self.assertEqual(effective_date, date(2026, 8, 22))
        self.assertEqual(rates, {"RUB": 1.0, "USD": 81.25, "EUR": 94.5, "TRY": 1.95})

    def test_converts_and_rounds_deal_amount_to_rubles(self):
        amount, rate = convert_amount_to_rub(
            Decimal("1234.56"),
            "USD",
            {"RUB": 1.0, "USD": 81.25},
        )

        self.assertEqual(rate, Decimal("81.25"))
        self.assertEqual(amount, Decimal("100308.00"))

    def test_rejects_unsupported_or_invalid_rates(self):
        with self.assertRaisesRegex(ValueError, "Unsupported deal currency"):
            convert_amount_to_rub(100, "GBP", {"GBP": 100.0})
        with self.assertRaisesRegex(ValueError, "Invalid exchange rate"):
            convert_amount_to_rub(100, "EUR", {"EUR": 0})


if __name__ == "__main__":
    unittest.main()
