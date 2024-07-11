import child_process from "node:child_process";
import LiveSplitClient from "livesplit-client";
import fs from "fs/promises";

class VoiceReminder {
  reservedWord = ["voice", "voice-filter"];
  config = new Map();
  currentSplitName = "-";
  configPath;
  constructor(configPath) {
    if (!configPath) {
      console.log("程序启动失败：需要提供一份已配置好的提示词文件");
      process.exit(1);
    }
    this.configPath = configPath;
  }
  showAllVoices(locale = "zh-CN", gender = undefined) {
    const keyNameTranslate = {
      Name: "音源全称",
      ShortName: "音源简称",
      Gender: "声音性别",
      Locale: "音源地区",
      ContentCategories: "适用的场合",
      VoicePersonalities: "声音特点",
    };
    const result = child_process.execSync("edge-tts-go --list-voices");
    const listRaw = result
      .toString("utf-8")
      .split("\n\n")
      .filter((i) => i);
    const list = listRaw.map((i) => {
      const result = {};
      const eachProp = i.split("\n");
      eachProp.forEach((i) => {
        const [key, value] = i.split(":").map((i) => i.trim());
        result[key] = value;
      });
      return result;
    });
    const filtered = list.filter((i) => {
      const isLocale = i.Locale.toLowerCase() == locale.toLowerCase();
      const isGender = gender ? i.Gender.toLowerCase() == gender.toLowerCase() : true;
      return isLocale && isGender;
    });
    const translated = filtered.map((i) => {
      const result = {};
      Object.keys(i).forEach((key) => {
        result[keyNameTranslate[key]] = i[key];
      });
      return result;
    });
    console.log(translated);
  }
  play(text) {
    const voice = this.config.get("voice") || "zh-CN-XiaoxiaoNeural";
    text = text.replace(/\r|\n/g, "").trim();
    if (!text) return;
    if (text.endsWith(".mp3")) {
      return child_process.exec(`ffplay -autoexit -nodisp -i ./voices/${text}`);
    }
    child_process.exec(`edge-tts-go --voice ${voice} --text "${text}" | ffplay -i -autoexit -nodisp -`);
  }
  async loadconfig(filePath) {
    if (!filePath) return;
    const result = await fs.readFile(filePath, "utf-8");
    const eachLine = result.split("\n").filter((i) => i && !i.startsWith("#"));
    this.config = new Map(eachLine.map((i) => i.split(":")));
  }
  async start() {
    await fs.mkdir("./voices", { recursive: true });
    await this.loadconfig(this.configPath);
    if (this.config.has("voice-filter")) {
      const [locale, gender] = this.config
        .get("voice-filter")
        .split(",")
        .map((i) => i.replace(/\r|\n/g, "").trim());
      this.showAllVoices(locale, gender);
    }
    const serverAddr = this.config.get("server-address") || "127.0.0.1:16834";
    const gapOfGetSplitName = this.config.has("wait-ms") ? Number(this.config.get("wait-ms")) : 100;
    const client = new LiveSplitClient(serverAddr);
    client.on("disconnected", () => {
      console.log("与 liveSplit 的连接已断开。");
      process.exit(0);
    });
    client.on("connected", () => {
      console.log("成功连接到 liveSplit。");
    });
    client.on("error", () => null);
    client.on("data", (data) => {
      const splitName = data.split("\n")[0];
      if (this.currentSplitName != splitName) {
        this.currentSplitName = splitName;
        console.log("分段更新:", splitName);
        if (this.reservedWord.includes(splitName)) return;
        this.config.has(splitName) && this.play(this.config.get(splitName));
      }
    });
    await client.connect().catch(() => console.log("连接到 liveSplit 失败。"));
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, gapOfGetSplitName));
      client.send("getcurrentsplitname");
    }
  }
}

new VoiceReminder(process.argv[2]).start();
