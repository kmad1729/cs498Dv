'''clean_data.py

utility script to select a bunch oc ountryes and calculate the number of cases
'''
from datetime import datetime, timedelta
import json
import csv

time_series_data_list = r'.\time_series_covid19_confirmed_global.csv'
filewide_dateFormat = r"%m/%d/%y"

final_data_to_write = {
    "dateExtent" : {
        "start_date" : datetime(year=2020, month=1, day=23).strftime(filewide_dateFormat),
        "end_date" : datetime(year=2020, month=7, day=26).strftime(filewide_dateFormat),
    },
    "dailyCaseExtent" : {
        "min_case_count" : -2512,
        "max_case_count" : 90000,
    },
}

# read the csv data
# calculate the total number of cases for each day

country_list = {

        "US" : {
            "population": int("329,064,917".replace(",", '')),
            "lockdown_start_date": None,
            "lockdown_end_date": None, 
            "case_per_capita_on_data": {},
        },
        "France" : {
            "population": int("65,129,728".replace(",", '')),
            "lockdown_start_date": datetime(year=2020, month=3, day=17).strftime(filewide_dateFormat),
            "lockdown_end_date": datetime(year=2020, month=5, day=11).strftime(filewide_dateFormat),
            "case_per_capita_on_data" :  {},
        },
        "Germany" : {
            "population": int("83,517,045	".replace(",", '')),
            "lockdown_start_date": datetime(year=2020, month=3, day=23).strftime(filewide_dateFormat),
            "lockdown_end_date": datetime(year=2020, month=5, day=10).strftime(filewide_dateFormat),
            "case_per_capita_on_data" : {},
        },
        "United_Kingdom" : {
            "population": int("67,530,172".replace(",", '')),
            "lockdown_start_date": datetime(year=2020, month=3, day=23).strftime(filewide_dateFormat), 
            "lockdown_end_date": None, 
            "case_per_capita_on_data" : {},
        },
        "Italy" : {
            "lockdown_end_date": datetime(year=2020, month=5, day=18).strftime(filewide_dateFormat),
            "population": int("60,550,075".replace(",", '')),
            "lockdown_start_date": datetime(year=2020, month=3, day=9).strftime(filewide_dateFormat),
            "case_per_capita_on_data" : {},
        },
        "India" : {
            "population": int("1,366,417,754".replace(",", '')),
            "lockdown_start_date": datetime(year=2020, month=3, day=25).strftime(filewide_dateFormat),
            "lockdown_end_date": datetime(year=2020, month=6, day=30).strftime(filewide_dateFormat),
            "case_per_capita_on_data" : {},
        },
        "Turkey" : {
            "population": int("83,429,615".replace(",", '')),
            "lockdown_start_date": datetime(year=2020, month=4, day=23).strftime(filewide_dateFormat),
            "lockdown_end_date": datetime(year=2020, month=4, day=27).strftime(filewide_dateFormat),
            "case_per_capita_on_data" : {},
        },
        "Brazil" : {
            "population": int("211,049,527".replace(",", '')),
            "lockdown_start_date": None,
            "lockdown_end_date": None, 
            "case_per_capita_on_data" : {},
        },
}

date_to_country_mapping = {}

for country_name in country_list:
    country_name_with_space = country_name.replace("_", " ")
    with open(time_series_data_list) as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['Country/Region'] == country_name_with_space and row['Province/State'] == '':
                print(f"Found country {country_name_with_space}!! Lat = {row['Lat']} Long = {row['Long']}")
                break

    # datetime.strptime("1/23/20", filewide_dateFormat)
    for col in row.keys():
        try:
            formatted_date = datetime.strptime(col, filewide_dateFormat)
            prev_date = formatted_date + timedelta(days=-1)
            # prev_date_col = prev_date.strftime(filewide_dateFormat)

            prev_date_col = '{dt.month}/{dt.day}/20'.format(dt = prev_date)
            try:
                prev_count_val, curr_count_val = map(int, (row[prev_date_col], row[col]))
                case_count_inc = curr_count_val - prev_count_val
            except KeyError:
                print(f'no data for prev date: {prev_date_col} continuing')
                continue

            curr_val = country_list[country_name]
            country_pop = curr_val["population"]
            #data_to_add = round(int(row[col])/country_pop * 10e6)
            #data_to_add = round(case_count_inc/country_pop * 10e6)
            data_to_add = case_count_inc
            abs_case_count = round(curr_count_val/country_pop * 10e5)


            # curr_val["case_per_capita_on_data"][col] = { 'delta' : data_to_add, 'abs_case_count' :  abs_case_count}
            print(f'{formatted_date}: country:{country_name}-- {col}-- case count: {abs_case_count} -- delta: {data_to_add}')
            if col not in date_to_country_mapping:
                date_to_country_mapping[col] = {}
            date_to_country_mapping[col][country_name] = data_to_add
        except ValueError:
            continue  

date_wise_list = []
for date, country_data in date_to_country_mapping.items():
    curr_obj = {"date" : date}
    for country_name, country_val in country_data.items():
        curr_obj[country_name] = country_val
    date_wise_list.append(curr_obj)

final_data_to_write["date_to_country_mapping"] = date_wise_list
final_data_to_write["country_list"] = country_list


ofname = "final_data.json"
with open(ofname, 'w') as f:
    json.dump(final_data_to_write, f, indent=2)