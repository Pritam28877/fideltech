// Copyright (c) 2025, Hybrowlabs and contributors
// For license information, please see license.txt


frappe.query_reports["Timesheet Report User"] = {
    "filters": [
        {
            "fieldname": "employee",
            "label": __("Employee"),
            "fieldtype": "Link",
            "options": "Employee",
            "reqd": 0
        },
        {
            "fieldname": "start_date",
            "label": __("Start Date"),
            "fieldtype": "Date",
            "reqd": 1
        },
        {
            "fieldname": "end_date",
            "label": __("End Date"),
            "fieldtype": "Date",
            "reqd": 1
        },
        {
            "fieldname": "custom_customer_name",
            "label": __("Customer Name"),
            "fieldtype": "Link",
            "options": "Customer",
            "reqd": 0
        }
    ]
};
