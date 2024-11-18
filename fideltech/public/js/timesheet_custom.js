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
    refresh: function(frm) {
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
const japaneseDaysMap = new Map([
    [0, "日曜日"],  // Sunday
    [1, "月曜日"],  // Monday
    [2, "火曜日"],  // Tuesday
    [3, "水曜日"],  // Wednesday
    [4, "木曜日"],  // Thursday
    [5, "金曜日"],  // Friday
    [6, "土曜日"]   // Saturday
]);

function getJapaneseDayName(date) {
    return japaneseDaysMap.get(date.getDay()); // Get the day name in Japanese using the Map
}

// Function to populate time logs with weekends and holidays
function populateTimeLogs(frm, start, end) {
    while (start <= end) {
        let dayName = getJapaneseDayName(start); // Get the day name in Japanese
        let hours = isWeekend(start) ? 0.00 : 8.00;

        frm.add_child("time_logs", {
            "custom_date": formatDate(start),  // Use Japanese format for date
            "custom_day": dayName,                     // Use Japanese day name
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
        let dayName = getJapaneseDayName(start); // Get the day name in Japanese
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
        calculate_hours(frm, cdt, cdn);
    },
    custom_overtime_hours_125: function (frm, cdt, cdn) {
        calculate_hours(frm, cdt, cdn);
    },
    custom_overtime_hours_135: function (frm, cdt, cdn) {
        calculate_hours(frm, cdt, cdn);
    },
    custom_leave_type: function (frm, cdt, cdn) {
        // Recalculate hours and amounts when leave type is changed
        calculate_hours(frm, cdt, cdn);
    }
});

// Function to calculate hours and update the totals
function calculate_hours(frm, cdt, cdn) {
    var child = locals[cdt][cdn];

    if (frm._setting_hours) return; // Prevents recursive updates

    // Check the custom_leave_type field and adjust hours accordingly
    if (child.custom_leave_type === "Paid") {
        // Set regular hours to 0 and sick leave to 8 hours
        frappe.model.set_value(cdt, cdn, "custom_regular_hours", 0.00);
        frappe.model.set_value(cdt, cdn, "custom_sick", 8.00);
    } else if (child.custom_leave_type === "Unpaid") {
        // Set both regular hours and sick leave to 0 for Unpaid leave
        frappe.model.set_value(cdt, cdn, "custom_regular_hours", 0.00);
        frappe.model.set_value(cdt, cdn, "custom_sick", 0.00);
    }

    // Calculate total hours
    var total_hours = (child.custom_regular_hours || 0) + 
                      (child.custom_overtime_hours_125 || 0) + 
                      (child.custom_overtime_hours_135 || 0) + 
                      (child.custom_sick || 0);
    
    frappe.model.set_value(cdt, cdn, "custom_total", total_hours);
    frappe.model.set_value(cdt, cdn, "hours", total_hours);

    // Update time and amount calculations
    calculate_time_and_amount(frm);
}



var calculate_time_and_amount = function (frm) {
    let tl = frm.doc.time_logs || [];
    let total_working_hr = 0;
    let custom_total_sick_hours = 0;
    let custom_total_regular_hours = 0;
    let custom_total_overtime_hours_125 = 0;
    let custom_total_overtime_hours_135 = 0;
    let custom_total_unpaid_leave_days = 0;

    let normal_pay = 0;
    let unpaid_deduction = 0;
    let custom_total_bill_amount = 0;

    let rate = frm.doc.custom_employee_rate_;
    let rate_type = frm.doc.custom_rate_type; // Hourly, Daily, Monthly
    let daily_hours = 8; // Standard working hours in a day
    let monthly_fixed_hours = 0;
    let monthly_days = 0;

    // Calculate working days and hours dynamically for the month
    let currentDate = new Date();
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    monthly_days = calculateWorkingDays(year, month);
    monthly_fixed_hours = monthly_days * daily_hours;

    // Accumulate time logs
    for (var i = 0; i < tl.length; i++) {
        if (tl[i].custom_leave_type === "Unpaid") {
            custom_total_unpaid_leave_days++;
            // If unpaid leave, exclude from working hours but consider 8 hours for deduction
            custom_total_regular_hours += daily_hours;
        } else {
            // Accumulate only for regular or sick days
            total_working_hr += tl[i].custom_total;
            custom_total_regular_hours += tl[i].custom_regular_hours;
            custom_total_overtime_hours_125 += tl[i].custom_overtime_hours_125;
            custom_total_overtime_hours_135 += tl[i].custom_overtime_hours_135;
            custom_total_sick_hours += tl[i].custom_sick;
        }
    }

    // Calculate normal pay and deductions
    if (rate_type === "Hourly") {
        normal_pay = custom_total_regular_hours * rate;
        unpaid_deduction = custom_total_unpaid_leave_days * daily_hours * rate;
    } else if (rate_type === "Daily") {
        let daily_rate = rate;
        let worked_days = custom_total_regular_hours / daily_hours;
        normal_pay = worked_days * daily_rate;
        unpaid_deduction = custom_total_unpaid_leave_days * daily_rate;
    } else if (rate_type === "Monthly") {
        let monthly_rate = rate;
        let hourly_rate = monthly_rate / monthly_fixed_hours;

        // Adjust for underworked hours
        if (custom_total_regular_hours < monthly_fixed_hours) {
            normal_pay = custom_total_regular_hours * hourly_rate;
        } else {
            normal_pay = monthly_rate; // Full pay for completing fixed hours
        }

        unpaid_deduction = custom_total_unpaid_leave_days * hourly_rate * daily_hours;
    }

    // Overtime Calculations
    let custom_total_overtime_amount_125 = 0;
    let custom_total_overtime_amount_135 = 0;

    if (rate_type === "Hourly") {
        custom_total_overtime_amount_125 = custom_total_overtime_hours_125 * rate * 1.25;
        custom_total_overtime_amount_135 = custom_total_overtime_hours_135 * rate * 1.35;
    } else if (rate_type === "Daily") {
        let daily_rate = rate;
        custom_total_overtime_amount_125 = (custom_total_overtime_hours_125 * (daily_rate * 1.25)) / daily_hours;
        custom_total_overtime_amount_135 = (custom_total_overtime_hours_135 * (daily_rate * 1.35)) / daily_hours;
    } else if (rate_type === "Monthly") {
        let monthly_rate = rate;
        custom_total_overtime_amount_125 = (custom_total_overtime_hours_125 * (monthly_rate * 1.25)) / (monthly_days * daily_hours);
        custom_total_overtime_amount_135 = (custom_total_overtime_hours_135 * (monthly_rate * 1.35)) / (monthly_days * daily_hours);
    }

    // Total bill amount including overtime
    custom_total_bill_amount =
        normal_pay +
        custom_total_overtime_amount_125 +
        custom_total_overtime_amount_135 -
        unpaid_deduction;


    custom_total_regular_hours  = normal_pay - unpaid_deduction ;
    // Update fields in the Timesheet
    frm.set_value("total_hours", total_working_hr);
    frm.set_value("custom_total_ragular_hours_amount", custom_total_regular_hours);
    frm.set_value("custom_approx_total_regular_hours_amount", normal_pay);
    frm.set_value("custom_total_overtime_hours_125", custom_total_overtime_hours_125);
    frm.set_value("custom_total_overtime_hours_135", custom_total_overtime_hours_135);    
    frm.set_value("custom_total_overtime_amount_125", custom_total_overtime_amount_125);
    frm.set_value("custom_total_overtime_amount_135", custom_total_overtime_amount_135);
    frm.set_value("custom_total_sick_amount1", custom_total_sick_hours * (rate / daily_hours));
    frm.set_value("custom_total_unpaid_deduction", unpaid_deduction);
    frm.set_value("custom_total_bill_amount", custom_total_bill_amount);
};

// Helper function to calculate working days in a month
function calculateWorkingDays(year, month) {
    let firstDay = new Date(year, month, 1);
    let lastDay = new Date(year, month + 1, 0);
    let workingDays = 0;

    while (firstDay <= lastDay) {
        let day = firstDay.getDay();
        if (day !== 0 && day !== 6) { // Exclude weekends
            workingDays++;
        }
        firstDay.setDate(firstDay.getDate() + 1);
    }

    return workingDays;
}



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
