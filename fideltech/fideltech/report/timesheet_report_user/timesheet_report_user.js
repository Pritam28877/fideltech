// Copyright (c) 2025, Hybrowlabs and contributors
// For license information, please see license.txt

frappe.query_reports["Timesheet Report User"] = {
    "filters": [
        {
            "fieldname": "employee",
            "label": __("Employee"),
            "fieldtype": "Link",
            "options": "Employee",
            "reqd": 0,
            "default": "", // Do not set by default
            "read_only": false // Initially not read-only
        },
        {
            "fieldname": "start_date",
            "label": __("Start Date"),
            "fieldtype": "Date",
            "reqd": 0,
            "default": frappe.datetime.month_start() // Automatically set to first day of the month
        },
        {
            "fieldname": "end_date",
            "label": __("End Date"),
            "fieldtype": "Date",
            "reqd": 0,
            "default": frappe.datetime.month_end() // Automatically set to last day of the month
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

// Function to get employee ID of the logged-in user
function get_employee_id() {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: "frappe.client.get_value",
            args: {
                doctype: "Employee",
                filters: { "user_id": frappe.session.user },
                fieldname: "name"
            },
            callback: function (r) {
                if (r.message && r.message.name) {
                    resolve(r.message.name);
                } else {
                    resolve(""); // If no Employee ID found, return empty
                }
            }
        });
    });
}

// Auto-populate employee field only if user has an Employee ID
frappe.query_reports["Timesheet Report User"].onload = function (report) {
    get_employee_id().then(employee_id => {
        if (employee_id) {
            frappe.query_report.set_filter_value("employee", employee_id);
            frappe.query_report.filters_by_name.employee.df.read_only = true; // Make it read-only
        } else {
            frappe.query_report.set_filter_value("employee", ""); // Leave empty
            frappe.query_report.filters_by_name.employee.df.read_only = false; // Keep it editable
        }
        frappe.query_report.refresh(); // Refresh report UI to apply changes
    });
};
