import { start } from "repl";
import chalk from "chalk";
import { commands } from "./commands.js";
import levelup from "levelup";
import leveldown from "leveldown";
import path from "path";
import { parser } from "./argumentParser.js";

// helper functions
const red = chalk.red;
const green = chalk.green;

let questionAsked = false;
let questionPromise = undefined;

let store = undefined;
let mode = "string";

const r = start({
  prompt: "level> ",
  ignoreUndefined: true,

  completer: (line) => {
    const completions = commands.map((x) => x.name);
    const hits = completions.filter((c) => c.startsWith(line));
    // Show all completions if none found
    return [hits.length ? hits : completions, line];
  },

  eval: (rawCmd, _, __, rawCallback) => {
    const callback = (str) => {
      const _callback = (val) => {
        if (val != undefined) console.log(val);
        rawCallback(null, undefined);
      };

      if (typeof str == "object") {
        str.then((val) => _callback(val));
        if (questionAsked) {
          questionAsked = false;
          questionPromise = undefined;
        }
      } else _callback(str);
    };

    const splitCmd = rawCmd.trim().split(" ");
    if (questionAsked) {
      if (splitCmd[0] == "y" || splitCmd[0] == "Y") {
        return callback(questionPromise);
      } else {
        questionAsked = false;
        return callback("cancelled");
      }
    }
    if (splitCmd[0] == "") return callback(undefined);

    const cmd = commands.find((x) => x.name === splitCmd[0]);
    if (!cmd) {
      return callback(
        `${red("command not found")}: ${splitCmd[0]}`,
      );
    }

    let arg = undefined;
    if (splitCmd.length == 1) {
      if (cmd.args.length > 0) {
        const initial = cmd.args[0];
        if (initial[2]) {
          return callback(
            `${red("Missing argument")}: '${initial[0]}': ${initial[1]}`,
          );
        }
      }
    } else {
      let parsed = parser(splitCmd.splice(1).join(" "));
      if (parsed[0] !== undefined) {
        return callback(`${red(`fatal: ${parsed[0]}`)}`);
      } else {
        arg = parsed[1];
        if (arg.length !== cmd.args.length) {
          return callback(
            `${
              red(
                `fatal: expected ${cmd.args.length} arguments, ${arg.length} given`,
              )
            }`,
          );
        }
      }
    }

    if (!store) {
      if (!["exit", "open", "mode"].find((x) => x === cmd.name)) {
        return callback(
          `${red(`unable to '${cmd.name}'`)}: no store opened`,
        );
      }
    }

    switch (cmd.name) {
      case "exit":
        return r.close();

      case "open": {
        store = levelup(leveldown(arg[0]));
        return callback(`${green("store opened")} at ${path.resolve(arg[0])}`);
      }

      case "mode": {
        if (arg === undefined) {
          return callback(
            `You're using ${mode} mode`,
          );
        } else {
          if (!["string", "object"].find((x) => x === arg[0])) {
            return callback(
              `${red(`unexpected '${arg}', expected 'string' or 'object'`)}`,
            );
          } else {
            mode = arg[0];
            return callback(`${green(`Mode set to ${arg}`)}`);
          }
        }
      }

      case "get": {
        return callback(
          store.get(arg[0], { asBuffer: false }).then((value) => {
            return mode == "object"
              ? JSON.parse(value.toString("utf-8"))
              : value;
          }).catch((e) => `${red("couldn't get")}: ${e}`),
        );
      }

      case "set": {
        return callback(
          store.put(
            arg[0],
            mode == "object"
              ? Buffer.from(JSON.stringify(arg[1]), "utf-8")
              : arg[1],
          ).then(() => `${green("set")} ${arg[0]}${chalk.yellow(":")}${arg[1]}`)
            .catch((e) => `${red("couldn't set")}: ${e}`),
        );
      }

      case "del": {
        return callback(
          store.del(arg[0]).then(() => {
            `${green("del")} ${arg[0]}`;
          }).catch((e) => `${red("couldn't del")}: ${e}`),
        );
      }

      case "clear": {
        questionAsked = true;
        questionPromise = store.clear().then(() => {
          return `${green("cleared")}`;
        }).catch((e) => `${red("couldn't clear")}: ${e}`);
        return callback(
          "This will clear the entire store. Proceed? (y/n on the next prompt)",
        );
      }
    }
  },
});
