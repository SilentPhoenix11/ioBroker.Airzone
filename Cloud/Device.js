const System = require('./System')
const AsyncRequest = require('../Utils/asyncRequest');
const Constants = require('./Constants');

class Device {
    constructor(airzone, deviceData)
    {       
        this.airzone = airzone;
        this.id = deviceData["id"];
        this.name = deviceData["name"];
        
        this.updateData(deviceData);
    }

    updateData(deviceData)
    {                
        this.status = deviceData["status"];
        this.mac = deviceData["mac"];
        this.pin = deviceData["pin"];
        this.target_temperature = deviceData["consign"];
    }

    async init() {
        if(!await this.load_systems())
            return false;

        return true;
    }

    async load_systems() {
        var systems_relations = await this.get_systems();
        if(systems_relations == undefined)
            return false;

        this.systems = [];
        let systemsCount = 0;
        for (let index = 0; index < systems_relations.length; index++) {
            var systemData = systems_relations[index];
            var system = new System(this.airzone, systemData);
            if(await system.init())
            {
                this.systems[systemsCount] = system;
                systemsCount++;
            }
        }

        return true;
    }

    async update_systems() {
        var systems_relations = await this.get_systems();
        if(systems_relations == undefined)
            return false;

        // TODO

        return true;
    }

    async get_systems() {
        var params = "/?device_id="+this.id+"&format=json&user_email="+this.airzone.username.toLowerCase()+"&user_token="+this.airzone.token;
        var url = this.airzone.base_url.concat(Constants.API_SYSTEMS, params);
        var response = await AsyncRequest.jsonGetRequest(url);

        var errors = response["errors"];
        if(errors)
        {
            this.logError("Failed to load systems of "+this.name+": (statusCode: "+response["statusCode"]+") - "+response["errors"]);
            return false;
        }
        var body = response["body"];
        var systems_relations = JSON.parse(body)["systems"];
        return systems_relations;
    }    
}
module.exports = Device;