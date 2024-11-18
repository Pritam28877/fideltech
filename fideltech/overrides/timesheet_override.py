from erpnext.projects.doctype.timesheet.timesheet import Timesheet

class CustomTimesheet(Timesheet):
    def on_submit(self):
        pass
        # Overriding the original method to skip validate_mandatory_fields
        # self.update_task_and_project()
    def validate_overlap(self, data):
        pass
