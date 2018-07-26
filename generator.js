const cluster = require('cluster');
const iohook = require('iohook');
const robot = require('robotjs');


module.exports = function() {
  if (cluster.isMaster) {
    /* create code table */
    var currentKey = '';
    var codeTable = {};
    iohook.on('keydown', (event) => {
      codeTable[event.keycode.toString()] = currentKey;
    });
    iohook.start();
    const worker = cluster.fork()
    worker.on('message', (m) => {
      if (m.cmd === 'keycode') {
        console.log("keycodeTable created");
        iohook.stop();
        console.log(codeTable);
        robot.keyTap('c', "control");
      } else if (m.cmd === 'type') {
        currentKey = m.key;
      }
    });
    worker.send('start');
    /* done creating code table */
  } else {
    const keys = `1234567890-=~qwertyuiop[]|asdfghjkl;'zxcvbnm,./`
    const specials = [
      "backspace", "delete",
      "enter", "tab", "escape",
      "up", "down", "right", "left",
      "home", "end",
      "pageup", "pagedown",
      "f1", "f2", "f3", "f4", "f5", "f6",
      "f7", "f8", "f9", "f10", "f11", "f12",
      "command", "alt", "shift", "right_shift", "space",
      "printscreen", "insert", 
      // "audio_mute", "audio_vol_down", "audio_vol_up", 
      // "audio_play", "audio_stop", "audio_pause", "audio_prev", "audio_next",
      "numpad_0", "numpad_1", "numpad_2", "numpad_3", "numpad_4",
      "numpad_8", "numpad_7", "numpad_6", "numpad_5", "numpad_9",
      "lights_mon_up", "lights_mon_down", "lights_kbd_toggle",
      "lights_kbd_up", "lights_kbd_down"
    ];
    process.on('message', () => {
      robot.setKeyboardDelay(1);
      for (let i = 0 ;i < keys.length;i++) {
        process.send({cmd: 'type', key: keys[i]});
        robot.keyTap(keys[i]);
      }

      for (let i = 0 ;i < specials.length;i++) {
        process.send({cmd: 'type', key: specials[i]});
        try {
          robot.keyTap(specials[i], ["alt", "command", "control", "shift"]);
        } catch (e) {
          console.log(`${specials[i]} is not supported on this OS`);
        }
      }
      process.send({cmd: 'keycode'});
    })
  }
}