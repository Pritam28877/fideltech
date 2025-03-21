app_name = "fideltech"
app_title = "Fideltech"
app_publisher = "Hybrowlabs"
app_description = "Fideltech"
app_email = "pritam@hybrowlabs.in"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "fideltech",
# 		"logo": "/assets/fideltech/logo.png",
# 		"title": "Fideltech",
# 		"route": "/fideltech",
# 		"has_permission": "fideltech.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/fideltech/css/fideltech.css"
# app_include_js = "/assets/fideltech/js/fideltech.js"

# include js, css files in header of web template
# web_include_css = "/assets/fideltech/css/fideltech.css"
# web_include_js = "/assets/fideltech/js/fideltech.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "fideltech/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
    "Timesheet": "public/js/timesheet_custom.js",
    "Sales Invoice" : "public/js/salesinvoice.js"
}
override_doctype_class = {
    "Timesheet": "fideltech.overrides.timesheet_override.CustomTimesheet"
}

doc_events = {
    "Timesheet": {
        "on_update": "fideltech.fideltech.doctype.timesheet.timesheet.on_timesheet_approve",
    }
}

scheduler_events = {
    "cron": {
        "0 0 * * *": [  
            "fideltech.cron.employee_status.check_employee_contract_status",
            "fideltech.cron.timesheetmail.remind_timesheet_submission"
        ],
    },
}
fixtures = [
    {"dt": "Workflow",},
    {"dt": "Workflow State",},
    {"dt": "Workflow Action Master"},
    # {"dt": "Print Format"},
    {"dt": "Translation"},
    {"dt": "Property Setter"},
    # {"dt": "Role", "filters": [["name", "in", ["Team Member", "Team Manager"]]]},
    # {"dt": "Custom DocPerm", "filters": [["parent", "in", ["Task"]]]},
    # {"dt": "Dashboard", "filters": [["name", "in", ["Team Tasks Overview"]]]},
    # {"dt": "Dashboard Chart", "filters": [["name", "in", ["Tasks per Team", "Task Status Distribution"]]]}
]


# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "fideltech/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "fideltech.utils.jinja_methods",
# 	"filters": "fideltech.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "fideltech.install.before_install"
# after_install = "fideltech.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "fideltech.uninstall.before_uninstall"
# after_uninstall = "fideltech.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "fideltech.utils.before_app_install"
# after_app_install = "fideltech.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "fideltech.utils.before_app_uninstall"
# after_app_uninstall = "fideltech.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "fideltech.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"fideltech.tasks.all"
# 	],
# 	"daily": [
# 		"fideltech.tasks.daily"
# 	],
# 	"hourly": [
# 		"fideltech.tasks.hourly"
# 	],
# 	"weekly": [
# 		"fideltech.tasks.weekly"
# 	],
# 	"monthly": [
# 		"fideltech.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "fideltech.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "fideltech.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "fideltech.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["fideltech.utils.before_request"]
# after_request = ["fideltech.utils.after_request"]

# Job Events
# ----------
# before_job = ["fideltech.utils.before_job"]
# after_job = ["fideltech.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"fideltech.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

