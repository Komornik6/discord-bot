const { readdirSync } = require('fs');

module.exports = (client) => {

    readdirSync('./events').forEach(file => {

        const event = require(`../events/${file}`)

        client.on(event.name, (...args) => {
            try { event.run(...args, client) } catch (e) {
		        console.log(e)
            }
        })

    })

}