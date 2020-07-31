'''extract_nationwide_locked_down.py

Util script to extract nationwide country locked down
'''
from datetime import datetime
import json
import csv
import os
import re

inp_fname = 'nationwide_locked_down_countries'
result = {}
filewide_dateFormat = r"%m/%d/%y"
with open(inp_fname) as f:
    for line in f:
        country_name, rest = line.split(",")
        country_name = country_name.strip()
        rest = rest.strip()
        date_fmt = r"(\d{4}\-\d{2}-\d{2})"
        start_date,rest = re.match(date_fmt + r"\s+(.*)", rest).groups()
        start_date = datetime.strptime(start_date.strip(), "%Y-%m-%d")
        rest = rest.strip()
        country_name = country_name.replace(' ', '_')
        to_date_match = re.match(date_fmt + r"\s+(.*)", rest)
        end_date = None
        if not to_date_match:
            # print(f"{country_name} there is not end date for country ")
            pass
        else:
            end_date,rest = re.match(date_fmt + r"\s+(.*)", rest).groups()
        
        if end_date:
            end_date = datetime.strptime(end_date.strip(), "%Y-%m-%d").strftime(filewide_dateFormat)
        
        # print(f"({country_name}) --> st_date: ({start_date}) --> end_date: ({end_date})")
        result[country_name] = {
            "lockdown_start_date" : start_date.strftime(filewide_dateFormat),
            "lockdown_end_date" : end_date,
        }

# TODO find the poplations
pop_fname = 'all_countries_pop_data.csv'
country_pop_dict = {}
with open(pop_fname, 'r') as f:
    reader = csv.DictReader(f, delimiter='\t')
    for row in reader:
        country_name = row["Country"].strip()
        country_name = country_name.replace(' ', '_')
        country_pop = int(row["Population2019"].replace(",", ''))
        # print(f'Country --> ({country_name}) pop --> ({country_pop})')
        assert country_name not in country_pop_dict
        country_pop_dict[country_name] = country_pop

for country in result:
    result[country]["population"] = country_pop_dict[country]

ofname = "nation_covid_pop_data.json"

with open(ofname, "w") as f:
    json.dump(result, f, indent=2)