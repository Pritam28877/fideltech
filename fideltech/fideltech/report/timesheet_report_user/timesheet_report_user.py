import frappe
from frappe.utils import getdate

def execute(filters=None):
    if not filters:
        filters = {}

    # Define report columns
    columns = [
        {"label": "Day", "fieldname": "custom_day", "fieldtype": "Data", "width": 120},
        {"label": "Date", "fieldname": "custom_date", "fieldtype": "Date", "width": 120},
        {"label": "Regular Hours", "fieldname": "custom_regular_hours", "fieldtype": "Float", "width": 120},
        {"label": "Overtime Hours (125%)", "fieldname": "custom_overtime_hours_125", "fieldtype": "Float", "width": 120},
        {"label": "Overtime Hours (135%)", "fieldname": "custom_overtime_hours_135", "fieldtype": "Float", "width": 120},
        {"label": "Sick Leave", "fieldname": "custom_sick", "fieldtype": "Float", "width": 120},
        {"label": "Total Hours", "fieldname": "custom_total", "fieldtype": "Float", "width": 120},
    ]

    conditions = "1=1"
    values = {}

    # Apply filters
    if filters.get("employee"):
        conditions += " AND parent.employee = %(employee)s"
        values["employee"] = filters.get("employee")

    if filters.get("custom_customer_name"):
        conditions += " AND parent.custom_customer_name = %(custom_customer_name)s"
        values["custom_customer_name"] = filters.get("custom_customer_name")

    if filters.get("start_date") and filters.get("end_date"):
        conditions += " AND child.custom_date BETWEEN %(start_date)s AND %(end_date)s"
        values["start_date"] = getdate(filters.get("start_date"))
        values["end_date"] = getdate(filters.get("end_date"))

    # Fetch data
    data = frappe.db.sql(
        f"""
        SELECT 
            child.custom_day, 
            child.custom_date, 
            child.custom_regular_hours, 
            child.custom_overtime_hours_125, 
            child.custom_overtime_hours_135, 
            child.custom_sick, 
            child.custom_total
        FROM `tabTimesheet Detail` AS child
        INNER JOIN `tabTimesheet` AS parent ON child.parent = parent.name
        WHERE {conditions}
        ORDER BY child.custom_date ASC
        """,
        values,
        as_dict=True
    )

    return columns, data
