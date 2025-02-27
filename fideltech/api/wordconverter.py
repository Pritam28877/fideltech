import frappe
from frappe.utils.data import money_in_words

@frappe.whitelist()
def get_money_in_words(amount, currency="INR"):
    """Convert amount to words."""
    return money_in_words(amount, currency)
