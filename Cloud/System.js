const Zone = require('./Zone')
const AsyncRequest = require('../Utils/asyncRequest');
const Constants = require('./Constants');

class System {
    constructor(airzone, systemData)
    {
        this.airzone = airzone;
        this.id = systemData["id"];
        this.name = systemData["name"];        

        this.device_id = systemData["device_id"];   
        this.system_number = systemData["system_number"];   

        this.min_temp = systemData["min_limit"];   
        this.max_temp = systemData["max_limit"];   

        this.updateData(systemData);
    }

    updateData(systemData)
    {                               
        this.has_velocity = systemData["has_velocity"];
        this.velocity_raw = systemData["velocity"];
        this.velocity = this.has_velocity ? Constants.VELOCITIES_CONVERTER[this.velocity_raw]["name"] : undefined;
        this.velocity_description = this.has_velocity ? Constants.VELOCITIES_CONVERTER[this.velocity_raw]["description"] : undefined;

        this.has_airflow = systemData["has_airflow"];
        this.airflow_raw = systemData["airflow"];
        this.airflow = this.has_airflow ? Constants.AIRFLOW_CONVERTER[this.airflow_raw]["name"] : undefined;
        this.airflow_description = this.has_airflow ? Constants.AIRFLOW_CONVERTER[this.airflow_raw]["description"] : undefined;

        this.mode_raw = systemData["mode"];
        this.mode = Constants.MODES_CONVERTER[this.mode_raw]["name"];
        this.mode_description = Constants.MODES_CONVERTER[this.mode_raw]["description"];

        this.eco_raw = systemData["eco"];
        this.eco = Constants.ECO_CONVERTER[this.eco_raw]["name"];
        this.eco_description = Constants.ECO_CONVERTER[this.mode_raw]["description"];
    }

    async init() {
        if(!await this.load_zones())
            return false;

        return true;
    }

    async load_zones() {

        var zones_relations = await this.get_zones();
        if(zones_relations == undefined)
            return false;

        this.zones = [];        
        for (let index = 0; index < zones_relations.length; index++) {
            var zoneData = zones_relations[index];
            var zone = new Zone(this.airzone, zoneData);
            this.zones[index] = zone;            
        }

        return true;
    }

    async update_zones() {
        var zones_relations = await this.get_zones();
        if(zones_relations == undefined)
            return false;

        // TODO

        return true;
    }

    async get_zones() {
        var params = "/?system_id="+this.id+"&format=json&user_email="+this.airzone.username.toLowerCase()+"&user_token="+this.airzone.token;
        var url = this.airzone.base_url.concat(Constants.API_ZONES, params);
        var response = await AsyncRequest.jsonGetRequest(url);

        var errors = response["errors"];
        if(errors)
        {
            this.logError("Failed to load zones of system "+this.name+": (statusCode: "+response["statusCode"]+") - "+response["errors"]);
            return false;
        }
        var body = response["body"];
        var zones_relations = JSON.parse(body)["zones"];
        return zones_relations;
    }
}
module.exports = System;