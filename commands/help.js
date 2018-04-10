require("dotenv").config();

const helpMsg = `Command reference:
/start - Start bot (mandatory in groups)
/send - Send XRP directly to a user
/tip - Tip a user in XRP (just in groups)
/deposit - Show deposit address
/balance - Show current balance
/withdraw - move your current balance to your personal wallet`;

class HelpCommand {
    constructor(app, db) {
        this.app = app;
        this.db = db;
        this.setCommand()
    }

    setCommand() {
        this.app.command('help', (ctx) => {
            const {replyWithMarkdown} = ctx;
            return replyWithMarkdown(helpMsg)
        })
    }
}

module.exports = HelpCommand;
