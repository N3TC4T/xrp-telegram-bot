require("dotenv").config();

class StartCommand {
    constructor(app, db) {
        this.app = app;
        this.db = db;
        this.setCommand()
    }

    setCommand() {
        this.app.command('start', (ctx) => {
            const {replyWithMarkdown} = ctx;
            const {username} = ctx.from;
            return replyWithMarkdown(
                `Welcome ${username} !\nPlease use /help to see the available commands`
            )
        })
    }
}

module.exports = StartCommand;
