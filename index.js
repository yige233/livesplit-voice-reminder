import child_process from "node:child_process";
import LiveSplitClient from "livesplit-client";
import fs from "fs/promises";
function play(text = "") {
  const voice = hint.get("voice") || "zh-CN-XiaoxiaoNeural";
  text = text.replace(/\r|\n/g, "").trim();
  if (!text) return;
  if (text.endsWith(".mp3")) {
    return child_process.exec(`ffplay -autoexit -nodisp -i ./voices/${text}`);
  }
  child_process.exec(`edge-tts-go --voice ${voice} --text "${text}" | ffplay -i -autoexit -nodisp -`);
}

async function loadhint() {
  const hint = await fs.readFile("./提示词.txt", "utf-8");
  const eachLine = hint.split("\n").filter((i) => !i.startsWith("#"));
  return new Map(eachLine.map((i) => i.split(":")));
}

let currentSplitName = "-";
const hint = await loadhint();
const client = new LiveSplitClient("127.0.0.1:16834");
try {
  client.on("disconnected", () => {
    console.log("与 liveSplit 的连接已断开。");
    process.exit(0);
  });
  client.on("connected", () => {
    console.log("成功连接到 liveSplit。");
  });
  await client.connect();
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const splitNameRaw = await client.getCurrentSplitName();
    const splitName = splitNameRaw.split("\n")[0];
    if (currentSplitName != splitName) {
      currentSplitName = splitName;
      console.log("分段更新:", splitName);
      if (splitName == "voice") continue;
      hint.has(splitName) && play(hint.get(splitName));
    }
  }
} catch {
  console.log("连接到 liveSplit 失败");
}
