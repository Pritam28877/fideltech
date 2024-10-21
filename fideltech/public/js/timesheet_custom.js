frappe.ui.form.on("Timesheet", {
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("This is a new timesheet");

            frm.clear_table("time_logs");

            let currentDate = new Date();
            let firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            let lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            let start = new Date(firstDay);
            let end = new Date(lastDay);

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

            while (start <= end) {
                let dayName = getDayName(start);

                // Set hours and total based on whether it's a weekend or not
                let hours = isWeekend(start) ? 0.00 : 8.00;
                let customTotal = isWeekend(start) ? 0.00 : 8.00;

                frm.add_child("time_logs", {
                    "custom_date": formatDate(start),  
                    "custom_day": dayName,  
                    "custom_regular_hours": hours,  
                    "custom_overtime_hours_125": 0.00,  
                    "custom_overtime_hours_135": 0.00,  
                    "custom_sick": 0.00,  
                    "custom_total": customTotal,  
                });

                start.setDate(start.getDate() + 1);  
            }

            frm.refresh_field("time_logs");
            calculate_time_and_amount(frm);
        } else {
            console.log("This timesheet is not new.");
        }
    },
    custom_employee_rate_: function (frm, cdt, cdn) {
        calculate_time_and_amount(frm);
    },
    // after_save: function(frm) {
	// 	frappe.model.set_value(cdt, cdn, "start_date", hours);
	// 	frappe.model.set_value(cdt, cdn, "end_date", hours);        
        
    // }

});


frappe.ui.form.on("Timesheet Detail", {

	custom_regular_hours: function (frm, cdt, cdn) {
		var child = locals[cdt][cdn];

		if (frm._setting_hours) return;

		var hours = child.custom_regular_hours + child.custom_overtime_hours_125 + child.custom_overtime_hours_135 ;
		frappe.model.set_value(cdt, cdn, "custom_total", hours);
		frappe.model.set_value(cdt, cdn, "hours", hours);

        calculate_time_and_amount(frm);
	},

    custom_overtime_hours_125: function (frm, cdt, cdn) {
		var child = locals[cdt][cdn];

		if (frm._setting_hours) return;

		var hours = child.custom_regular_hours + child.custom_overtime_hours_125 + child.custom_overtime_hours_135 ;
		frappe.model.set_value(cdt, cdn, "custom_total", hours);
		frappe.model.set_value(cdt, cdn, "hours", hours);

        calculate_time_and_amount(frm);
	},
    
    custom_overtime_hours_135: function (frm, cdt, cdn) {
		var child = locals[cdt][cdn];

		if (frm._setting_hours) return;

		var hours = child.custom_regular_hours + child.custom_overtime_hours_125 + child.custom_overtime_hours_135 ;
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
    let custom_total_ragular_hours = 0;
    let custom_total_overtime_Hours_125 = 0;
    let custom_total_overtime_Hours_135 = 0;
    let custom_total_overtime_amount_125_amount = 0
    let custom_total_overtime_amount_135_amount = 0
    let custom_total_ragular_hours_amount = 0
    let rate = frm.doc.custom_employee_rate_
    console.log(rate,"yy")
	for (var i = 0; i < tl.length; i++) {
		if (tl[i].custom_total) {
			total_working_hr += tl[i].custom_total;
            custom_total_ragular_hours += tl[i].custom_regular_hours ;
            custom_total_overtime_Hours_125 += tl[i].custom_overtime_hours_125;
            custom_total_overtime_Hours_135 += tl[i].custom_overtime_hours_135;

			// total_billable_amount += tl[i].billing_amount;
			// total_costing_amount += tl[i].costing_amount;
            

			if (tl[i].is_billable) {
				total_billing_hr += tl[i].billing_hours;
			}
		}
        
	}
    custom_total_ragular_hours_amount =  custom_total_ragular_hours * rate;
    custom_total_overtime_amount_125_amount =  custom_total_overtime_Hours_125 * rate * 1.25;
    custom_total_overtime_amount_135_amount =  custom_total_overtime_Hours_135 * rate * 1.35;

	frm.set_value("total_hours", total_working_hr);
    frm.set_value("custom_total_ragular_hours_amount", custom_total_ragular_hours_amount );
    frm.set_value("custom_total_overtime_amount_125", custom_total_overtime_amount_125_amount );
    frm.set_value("custom_total_overtime_amount_135", custom_total_overtime_amount_135_amount );
    frm.set_value("custom_total_bill_amount", custom_total_ragular_hours_amount +  custom_total_overtime_amount_125_amount +custom_total_overtime_amount_135_amount );
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
