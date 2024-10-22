frappe.ui.form.on("Timesheet", {
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("This is a new timesheet");
            frm.clear_table("time_logs");

            // Set the start and end date for the current month
            let currentDate = new Date();
            let firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            let lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            let start = new Date(firstDay);
            let end = new Date(lastDay);

            // Populate time_logs based on weekends and holidays
            populateTimeLogs(frm, start, end);
        } else {
            console.log("This timesheet is not new.");
        }
    },

    custom_employee_rate_: function(frm, cdt, cdn) {
        calculate_time_and_amount(frm);
    },

    custom_holiday_list: function(frm) {
        // When custom_holiday_list is changed, clear and re-populate time_logs
        frm.clear_table("time_logs");

        let currentDate = new Date();
        let firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        let lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        let start = new Date(firstDay);
        let end = new Date(lastDay);

        if (frm.doc.custom_holiday_list) {
            fetchHolidays(frm.doc.custom_holiday_list, function(holidayDates) {
                populateTimeLogsWithHolidays(frm, start, end, holidayDates);
            });
        }
    }
});

// Function to fetch holidays based on the holiday list
function fetchHolidays(holidayList, callback) {
    frappe.call({
        method: "fideltech.fideltech.doctype.timesheet.timesheet.get_holidays",  // Replace with your actual method path
        args: {
            holiday_list_name: holidayList  // Pass the holiday list as an argument
        },
        callback: function(response) {
            if (response.message) {
                console.log("Holidays found:", response.message);
                callback(response.message);  // Pass the holiday dates to the callback
            } else {
                console.error("No holidays found for the holiday list.");
                callback([]);  // Pass an empty array if no holidays found
            }
        }
    });
}

// Function to populate time logs with weekends and holidays
function populateTimeLogs(frm, start, end) {
    while (start <= end) {
        let dayName = getDayName(start);
        let hours = isWeekend(start) ? 0.00 : 8.00;

        frm.add_child("time_logs", {
            "custom_date": formatDate(start),  
            "custom_day": dayName,  
            "custom_regular_hours": hours,  
            "custom_overtime_hours_125": 0.00,  
            "custom_overtime_hours_135": 0.00,  
            "custom_sick": 0.00,  
            "custom_total": hours,  
            "hours": hours
        });

        start.setDate(start.getDate() + 1);
    }

    frm.refresh_field("time_logs");
    calculate_time_and_amount(frm);
}

// Function to populate time logs with holiday consideration
function populateTimeLogsWithHolidays(frm, start, end, holidayDates) {
    while (start <= end) {
        let dayName = getDayName(start);
        let formattedDate = formatDate(start);
        
        // Set hours based on weekend or holiday
        let hours = isWeekend(start) || holidayDates.includes(formattedDate) ? 0.00 : 8.00;

        frm.add_child("time_logs", {
            "custom_date": formattedDate,
            "custom_day": dayName,
            "custom_regular_hours": hours,
            "custom_overtime_hours_125": 0.00,
            "custom_overtime_hours_135": 0.00,
            "custom_sick": 0.00,
            "custom_total": hours,
            "hours": hours
        });

        start.setDate(start.getDate() + 1);
    }

    frm.refresh_field("time_logs");
    calculate_time_and_amount(frm);
}

// Helper functions
function formatDate(date) {
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');  
    let day = String(date.getDate()).padStart(2, '0');  
    return `${year}-${month}-${day}`;  
}

// Function to get the day of the week for a date
function getDayName(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// Function to check if the date is a weekend (Saturday or Sunday)
function isWeekend(date) {
    let day = date.getDay();  // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;  // Returns true if the day is Sunday (0) or Saturday (6)
}


frappe.ui.form.on("Timesheet Detail", {

	custom_regular_hours: function (frm, cdt, cdn) {
		var child = locals[cdt][cdn];

		if (frm._setting_hours) return;

		var hours = child.custom_regular_hours + child.custom_overtime_hours_125 + child.custom_overtime_hours_135 +child.custom_sick ;
		frappe.model.set_value(cdt, cdn, "custom_total", hours);
		frappe.model.set_value(cdt, cdn, "hours", hours);

        calculate_time_and_amount(frm);
	},

    custom_overtime_hours_125: function (frm, cdt, cdn) {
		var child = locals[cdt][cdn];

		if (frm._setting_hours) return;

		var hours = child.custom_regular_hours + child.custom_overtime_hours_125 + child.custom_overtime_hours_135 +child.custom_sick ;
		frappe.model.set_value(cdt, cdn, "custom_total", hours);
		frappe.model.set_value(cdt, cdn, "hours", hours);

        calculate_time_and_amount(frm);
	},
    
    custom_overtime_hours_135: function (frm, cdt, cdn) {
		var child = locals[cdt][cdn];

		if (frm._setting_hours) return;

		var hours = child.custom_regular_hours + child.custom_overtime_hours_125 + child.custom_overtime_hours_135 + child.custom_sick;
		frappe.model.set_value(cdt, cdn, "custom_total", hours);
		frappe.model.set_value(cdt, cdn, "hours", hours);

        
        calculate_time_and_amount(frm);
	},

    custom_total: function (frm, cdt, cdn) {        
        calculate_time_and_amount(frm);
    }


});


var calculate_time_and_amount = function (frm) {
	let tl = frm.doc.time_logs || [];
	let total_working_hr = 0;
	let total_billing_hr = 0;
	let total_billable_amount = 0;
	let total_costing_amount = 0;
    let custom_total_sick_hours = 0;
    let custom_total_sick_amount = 0
    let custom_total_ragular_hours = 0;
    let custom_total_overtime_Hours_125 = 0;
    let custom_total_overtime_Hours_135 = 0;
    let custom_total_overtime_amount_125_amount = 0
    let custom_total_overtime_amount_135_amount = 0
    let custom_total_ragular_hours_amount = 0
    let rate = frm.doc.custom_employee_rate_

	for (var i = 0; i < tl.length; i++) {
		if (tl[i].custom_total) {
			total_working_hr += tl[i].custom_total;
            custom_total_ragular_hours += tl[i].custom_regular_hours ;
            custom_total_overtime_Hours_125 += tl[i].custom_overtime_hours_125;
            custom_total_overtime_Hours_135 += tl[i].custom_overtime_hours_135;
            custom_total_sick_hours += tl[i].custom_sick;

			// total_billable_amount += tl[i].billing_amount;
			// total_costing_amount += tl[i].costing_amount;
            

			if (tl[i].is_billable) {
				total_billing_hr += tl[i].billing_hours;
			}
		}
        
	}
    custom_total_ragular_hours_amount =  custom_total_ragular_hours * rate;
    custom_total_sick_amount =  custom_total_sick_hours * rate ;
    custom_total_overtime_amount_125_amount =  custom_total_overtime_Hours_125 * rate * 1.25;
    custom_total_overtime_amount_135_amount =  custom_total_overtime_Hours_135 * rate * 1.35;

	frm.set_value("total_hours", total_working_hr);
    frm.set_value("custom_total_ragular_hours_amount", custom_total_ragular_hours_amount );
    frm.set_value("custom_total_overtime_amount_125", custom_total_overtime_amount_125_amount );
    frm.set_value("custom_total_overtime_amount_135", custom_total_overtime_amount_135_amount );
    frm.set_value("custom_total_sick_amount", custom_total_sick_amount );
    frm.set_value("custom_total_bill_amount", custom_total_ragular_hours_amount +  custom_total_overtime_amount_125_amount +custom_total_overtime_amount_135_amount + custom_total_sick_amount );
};


frappe.listview_settings['Timesheet'] = {
    onload: function(listview) {
        // Ensure Delete button is available for Administrator in List View
        if (frappe.user.has_role('Administrator')) {
            listview.page.add_action_item(__('Delete'), function() {
                listview.call_for_selected_items('frappe.desk.reportview.delete', {
                    doctype: 'Timesheet'
                });
            });
        }
    }
};
