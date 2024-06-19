import { z } from "zod";
import { zerialize, dezerialize } from "../dist/esm/index.js";

const $ = (sel) => {
  return document.querySelector(sel);
};

$("#dezerialize").addEventListener("click", () => {
  let js;
  try {
    js = eval(`(${$("#js").value})`);
  } catch (err) {
    alert("Error evaluating JavaScript");
    return;
  }

  let json;
  try {
    json = JSON.parse($("#zodexJSON").value);
  } catch (err) {
    alert("Error evaluating JSON");
    return;
  }

  let dez;
  try {
    dez = dezerialize(json);
  } catch (err) {
    alert("Error dezerializing JSON");
    return;
  }

  let parseObj;
  try {
    parseObj = dez.safeParse(js);
  } catch (err) {
    alert("Error parsing JavaScript");
    return;
  }

  alert(JSON.stringify(parseObj, null, 2));
});

$("#zerialize").addEventListener("click", () => {
  let zod;
  try {
    zod = eval(`(${$("#zod").value})`);
  } catch (err) {
    alert("Error evaluating Zod");
    return;
  }
  let zer;
  try {
    zer = zerialize(zod);
  } catch (err) {
    alert("Error zerializing Zod");
    return;
  }

  try {
    $("#zodexJSON").value = JSON.stringify(zer, null, 2);
  } catch (err) {
    alert("Error stringifying Zod JSON object");
    return;
  }
});
