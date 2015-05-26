// ==UserScript==
// @name           MyFitnessPal Percentages
// @version        1.1
// @namespace      gordondev
// @description    Adds display of Carb/Protein/Fat percentages to any daily food diary page. Based on "MyFitnessPal Percentages and Net Carbs"
// @match          http://www.myfitnesspal.com/food/diary/*
// @match          https://www.myfitnesspal.com/food/diary/*
// @grant none
// ==/UserScript==


/*  
 *  ------------------------------------------------------------
 * Thanks to kt123 and Wickity for the fixes.
 *  ------------------------------------------------------------
 */
/*  
 *  ------------------------------------------------------------
 *  Based off of https://github.com/Surye/mfp-keto-userscript
 *  which is based off of http://userscripts.org/scripts/show/104606
 *  Much credit to Surye and Bompus, respectively, hope it's okay I used it!
 *  ------------------------------------------------------------
 */

function exec(fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = '(' + fn + ')();';
    document.body.appendChild(script); // run the script
    document.body.removeChild(script); // clean up
}

function addJquery() {
    script = document.createElement("script");
    script.setAttribute("src", "//ajax.googleapis.com/ajax/libs/jquery/1.10.0/jquery.min.js");
    document.body.appendChild(script);
}

function startRun() {
    var script = document.createElement("script");
    script.setAttribute("src", "//www.google.com/jsapi");
    script.addEventListener('load', function () {
        exec(jsapiLoaded);
    }, false);
    document.body.appendChild(script);

    // $ just makes life easier
    // We won't be picky with whether it's $ or Zepto, though
    if(typeof $ == 'undefined') {
        addJquery();
    }

    script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = main;
    document.body.appendChild(script);
}

startRun();

function jsapiLoaded() {
    google.load("visualization", "1", { packages: ["corechart"], "callback": main });
}

function main() {
    var calories_i = 0;
    var carbs_i = 0;
    var protein_i = 0;
    var fat_i = 0;

    var daily_total_carbs = 0;
    var daily_total_protein = 0;
    var daily_total_fat = 0;

    var header_tr_element = $('.food_container tr.meal_header:first');

    var elem_i = 0;
    header_tr_element.find('td').each(function () {
        var myval = $(this).text().toLowerCase();
        if (myval == 'calories') { calories_i = elem_i; }
        if (myval == 'carbs') { carbs_i = elem_i; }
        // if (myval == 'fiber') { fiber_i = elem_i; }
        if (myval == 'fat') { fat_i = elem_i; }
        if (myval == 'protein') { protein_i = elem_i; }

        elem_i += 1;
    });

    var bottom_tr_elements = $('.food_container tr.bottom, .food_container tr.total');
    bottom_tr_elements.each(function () {

        if ($(this).hasClass('remaining')) {
            return false; /* continue */
        }

        var cals = 0;
        var fiber = 0;
        var carbs = 0;
        var protein = 0;
        var fat = 0;

        var tds = $(this).find('td');
        var cals = tds.eq(calories_i).text();
        var carbs = tds.eq(carbs_i).text();
        var protein = tds.eq(protein_i).text();
        var fat = tds.eq(fat_i).text();

        cals = parseInt(cals);
        carbs = parseInt(carbs);
        protein = parseInt(protein);
        fat = parseInt(fat);

        var carb_cals = (carbs * 4);
        var protein_cals = (protein * 4);
        var fat_cals = (fat * 9);

        if ($(this).hasClass('total')
                && !$(this).hasClass('alt')
                && daily_total_carbs == 0) {
            daily_total_carbs = carb_cals;
            daily_total_protein = protein_cals;
            daily_total_fat = fat_cals;
        }

        real_cals = carb_cals + protein_cals + fat_cals;

        var carb_pct = (carb_cals / real_cals).toFixed(2) * 100;
        var fat_pct = (fat_cals / real_cals).toFixed(2) * 100;
        var protein_pct = (protein_cals / real_cals).toFixed(2) * 100;

        carb_pct = Math.round(carb_pct);
        fat_pct = Math.round(fat_pct);
        protein_pct = Math.round(protein_pct);

        tds.each(function () { $(this).append('<div class="myfp_us" style="color:#0a0;font-size:9px;text-align:center;">&nbsp;</div>'); });

        tds.eq(0).find('div.myfp_us').html("");

        if (!isNaN(carb_pct)) {
            tds.eq(carbs_i).find('div.myfp_us').html(carb_pct + "%");
        }
        if (!isNaN(fat_pct)) {
            tds.eq(fat_i).find('div.myfp_us').html(fat_pct + "%");
        }
        if (!isNaN(protein_pct)) {
            tds.eq(protein_i).find('div.myfp_us').html(protein_pct + "%");
        }
    });

    if (daily_total_carbs != 0 || daily_total_protein != 0 || daily_total_fat != 0) {
        $('.food_container').append('<div id="google_graph_1"></div>');

        var data1 = new google.visualization.DataTable();
        data1.addColumn('string', 'Type');
        data1.addColumn('number', 'Cals');
        data1.addRows([
           ['Carbs', daily_total_carbs],
           ['Protein', daily_total_protein],
           ['Fat', daily_total_fat]
        ]);

        var chart = new google.visualization.PieChart(document.getElementById('google_graph_1'));
        chart.draw(data1, { width: 350, height: 300, title: 'Daily Totals by Calories (This is what you use for your macro ratios)' });
        document.getElementById('google_graph_1').style.cssFloat = "left";

        $('.food_container').append('<div id="google_graph_2"></div>');

        carb_grams = daily_total_carbs / 4;
        pro_grams = daily_total_protein / 4;
        fat_grams = daily_total_fat / 9;

        var data2 = new google.visualization.DataTable();
        data2.addColumn('string', 'Type');
        data2.addColumn('number', 'Grams');
        data2.addRows([
           ['Carbs (' + carb_grams + 'g)', carb_grams],
           ['Protein (' + pro_grams + 'g)', pro_grams],
           ['Fat (' + fat_grams + 'g)', fat_grams]
        ]);

        var chart2 = new google.visualization.PieChart(document.getElementById('google_graph_2'));
        chart2.draw(data2, { width: 350, height: 300, title: 'Daily Totals by Grams' });
        document.getElementById('google_graph_2').style.cssFloat = "right";
    }
}
