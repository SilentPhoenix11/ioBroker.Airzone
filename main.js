'use strict';

const adaptername = "airzone"

const utils = require('@iobroker/adapter-core');
const AirzoneCloud = require("./Cloud/AirzoneCloud");


class Template extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: adaptername,
        });        
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));        
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    
    async onReady() {
        // Initialize your adapter here
        this.session = new AirzoneCloud(this, this.config.username, this.config.password, this.config.base_url);
        await this.session.init();
        this.log.info("init done...")

        if(this.config.sync_time > 0) {
        this.callReadAirzone = setInterval(
            (function(self) {         //Self-executing func which takes 'this' as self
                return async function() {   //Return a function in the context of 'self'
                    self.log.info('update from airzone ...');
                    await self.session.update();
                    self.log.info("update done...")
                }
            })(this),
             this.config.sync_time * 1000);
        }
        /*
        For every state in the system there has to be also an object of type state
        Here a simple template for a boolean variable named "testVariable"
        Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
        */
        /*
        await this.setObjectNotExistsAsync('testVariable', {
            type: 'state',
            common: {
                name: 'testVariable',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: true,
            },
            native: {},
        });
        */
        /*
        // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
        this.subscribeStates('testVariable');
        // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
        // this.subscribeStates('lights.*');
        // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
        // this.subscribeStates('*');

        /////////////////
        //    setState examples
        //    you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
        /////////////////
        // the variable testVariable is set to true as command (ack=false)
        await this.setStateAsync('testVariable', true);

        // same thing, but the value is flagged "ack"
        // ack should be always set to true if the value is received from or acknowledged from the target system
        await this.setStateAsync('testVariable', { val: true, ack: true });

        // same thing, but the state is deleted after 30s (getState will return null afterwards)
        await this.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });

        // examples for the checkPassword/checkGroup functions
        let result = await this.checkPasswordAsync('admin', 'iobroker');
        this.log.info('check user admin pw iobroker: ' + result);

        result = await this.checkGroupAsync('admin', 'admin');
        this.log.info('check group user admin group admin: ' + result);
        */
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            if (this.callReadAirzone !== null) {
                clearInterval(this.callReadActuator);
                adapter.log.debug('update timer cleared');
            }
            
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            callback();
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  * @param {string} id
    //  * @param {ioBroker.Object | null | undefined} obj
    //  */
    // onObjectChange(id, obj) {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    // onMessage(obj) {
    //     if (typeof obj === 'object' && obj.message) {
    //         if (obj.command === 'send') {
    //             // e.g. send email or pushover or whatever
    //             this.log.info('send command');

    //             // Send response in callback if required
    //             if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
    //         }
    //     }
    // }

    async createProperty(_path, _name, _type, _read, _write){
        await this.setObjectNotExistsAsync(_path+"."+_name, {
            type: 'state',
            common: {
                name: _name,
                type: _type,
                read: _read,
                write: _write,
            },
            native: {},
        });
    }

    async createProperty(_path, _name, _type, _min, _max, _unit, _read, _write){
        await this.setObjectNotExistsAsync(_path+"."+_name, {
            type: 'state',
            common: {
                name: _name,
                type: _type,
                read: _read,
                write: _write,
                min : _min,
                max : _max,
                unit : _unit
            },
            native: {},
        });
    }

    async updatePropertyValue(_path, _name, _value) {
        await this.setStateAsync(_path+"."+_name, { val: _value, ack: true } );
    }

    async createPropertyAndInit(_path, _name, _type, _read, _write, _value){
        await this.createProperty(_path, _name, _type, _read, _write);
        await this.updatePropertyValue(_path, _name, _value);
    }

}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Template(options);
} else {
    // otherwise start the instance directly
    new Template();
}