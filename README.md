# The Game Changer 
Electron port to Ernie Ball's Game Changer web application 

## Introduction
This is an attempt of making an Electron port of Ernie Ball's Game Changer web application. The main goal is to create a simple desktop application that allows for communicating with the Game Changer guitar/bass without the need of internet connection. The original app can be found here:

http://gamechanger.music-man.com/app.eb

Most of the code was taken from the web application and a big part of the effort was concentrated into adaptin it into the Electron environment. The interface is very similar to th original application, though here are some notable differences:

* No external plugin is necessary for the USB communication. node-usb library should take care of this
* The interface related to user account was left out, as the intention is to make it a simple desktop app.
* No internet connection needed for interfacing with your Game Changer guitar/bass
* Some simple file handling was implemented for saving and opening your presets

## Installation

In order to install and run this application you will need npm. On Linux npm should already be installed by default. On Windows you can download it on the official web page https://nodejs.org/en/download/. Make sure you have it added to your path. This application should be cross platform, though most of the tests are being done under Linux, some tests on Windows and almost no tests were done on Mac.

### Checkout or download this repo
```
git checkout https://github.com/edwillys/gamechanger
cd gamechanger
```

### Install the app

Open the terminal or command shell on the folder you checked out this repository and run:
```
npm install
```

### Build the node-usb

Linux
```
./node_modules/.bin/electron-rebuild
```

Windows:
```
node_modules/.bin/electron-rebuild.cmd
```

### Give permission to access Game Changer USB device (Linux)
Create a .rules file in /etc/udev/rules.d (for example gamechanger.rules) containing the following line:

```
SUBSYSTEM=="usb", ATTRS{idVendor}=="237e", ATTRS{idProduct}=="0001", MODE="0666"
```

Note the case of the hex numbers, as this makes all the difference. Reload the rules:

```
udevadm control --reload-rules
```

### Launch the app

```
npm start
```

## USB communication

A big part of the effort was to understand how the USB communication protocol works. The game changer intruments use USB URB (request block) protocol.It mainly works via a request-response mechanism, with the first byte being the command or the command response. The following bytes, if any, are the payload and depend on the command. I try to sum up with the command description below. please note that there might be errors or innacurrate information.

| Request | Response | Description |
| --- | --- | --- |
| [0x00] | [0x80] <br> [model (1 byte)]: 1 for all (?) <br> [type (1 byte)]: 5=HSHP, 4=HSH, 3=HHP, 2=HH, 1=Bass HH <br> [serial (8 bytes)]: ASCII code <br> [HW revision (4 bytes)]: ASCII code <br> [lever switch (1 byte)]: 5 for all (?) | Get Instrument Config |
| [0x01] | [0x81] <br> [restore behavior (1 byte)] <br> [eeprom revision (4 byte)]: ASCII code <br> [firmware revision (4 byte)]: ASCII code| Get Memory Config |
| [0x02] | [0x82] <br> [bankA behavior (1 byte)]: <br> 1=active 2=passive 3=passive <br> [bankB behavior (1 byte)]: 1=active 2=passive 3=passive <br> [bankZ behavior (1 byte)]: 1=active 2=passive 3=passive <br> [bankZ kickout (1 byte)]: (not used) <br> [routing mode (1 byte)]: 1=Mono. All pickup signals will be mixed and sent to the output jack tip. 2=Stereo. Magnetic pickup signals will be sent to the output jack tip. <br> [piezo pot (1 byte)]: 1=Blend between Magnetic and Piezo signals with a Master Volume control 2=Use independent Volume controls for Magnetic and Piezo signals <br> [piezo button (1 byte)]: 1=Toggle the Piezo pickup in or out of the signal DEPENDING on the Preset status 2=Toggle the Piezo pickup in or out of the signal INDEPENDENT of the Preset status <br> [max midi in (1 byte)]: default 10 <br> [max midi out (1 byte)]: default 10 <br> [midi mode (1 byte)]: [max bankZ (1 byte)]: default 15 <br> [bankZ switch (1 byte)]: 1=up(bankz increment)/down(bankz decrement) 2=up(bankz preset1)/down(bankz preset2) 3=up(bankz preset1)/down(bankz kickout to bankA/B) 4=up(MIDI OUT bankz up)/down(MIDI OUT bankz down)| Get Intrument Behavior |
| [0x03] | [0x83] <br> [scheme ID (1 byte)] <br> [(3 bytes)] <br> [bankA ID (1 byte)]<br> [(3 bytes)] <br> [bankB ID (1 byte)]<br> [(3 bytes)] <br> [bankZ ID (1 byte)]<br> [(3 bytes)]| Get Scheme Banks ID |
| [0x04] <br> [preset_pointer (1 byte)]: from 0 to 24 (0-4 is bankA, 5-9 is bankB, 10-24 is bankZ) | [0x84] <br> [preset_id (2 bytes)]: integer (low endian) | Get Preset ID |
| [0x05] <br> [preset_pointer (1 byte)]: from 0 to 24 (0-4 is bankA, 5-9 is bankB, 10-24 is bankZ) | [0x85] <br> [coil config (16 bytes)]| Get Preset |
| [0x06] | [0x86] <br> [MIDI id in (4 bytes)]: integer (little endian) <br> [MIDI id out (4 bytes)]: integer (little endian) | Get MIDI schema ID |
| [0x07] <br> [midi_slot (1 byte)]: from 0 to "max midi in" | [0x87] <br> [data (4 bytes)] | Get MIDI in slot |
| [0x08] <br> [midi_slot (1 byte)]: from 0 to "max midi out" | [0x88] <br> [data (4 bytes)] | Get MIDI out slot |
| [0x0A] | [0x8A] <br> [battery % (1 byte)]: Percentage | Get Battery Status |
| [0x0D] | [0x8D] <br> [bankA behavior (1 byte)]: <br> [bankB behavior (1 byte)]: <br> [bankZ behavior (1 byte)]: <br> [bankZ kickout (1 byte)]: <br> [routing mode (1 byte)]: <br> [piezo pot (1 byte)]: <br> [piezo button (1 byte)]: <br> [max midi in (1 byte)]: <br> [max midi out (1 byte)]: <br> [midi mode (1 byte)]: <br> [max bankZ (1 byte)]: <br> [bankZ switch (1 byte)]: <br>  | Write Intrument Behavior |
| [0x0E] <br> [scheme ID (1 byte)] <br> [(3 bytes)] <br> [bankA ID (1 byte)]<br> [(3 bytes)] <br> [bankB ID (1 byte)]<br> [(3 bytes)] <br> [bankZ ID (1 byte)]<br> [(3 bytes)] | [0x8E] | Write Scheme Banks ID |
| [0x0F] <br> [preset_pointer (1 byte)]: 0 to 24 (0-4 is bankA, 5-9 is bankB, 10-24 is bankZ) <br> [preset_id (2 bytes)]: integer (low endian)| [0x8F] | Write Preset ID |
| [0x10] <br> [preset_pointer (1 byte)]: from 0 to 24 (0-4 is bankA, 5-9 is bankB, 10-24 is bankZ) <br> [coil config (16 bytes)] | [0x90] | Write Preset |
| [0x15] <br> [mute preset id (4 bytes)]: integer (little endian) <br> [mute coil config (16 bytes)]: 0x80000000FFFFFFFFFFFFFFFF | [0x95] | Write Audition Sync |
| [0x16] | [0x96] | Set Mute ON |
| [0x17] | [0x97] | Set Mute OFF |

## Coil Wiring 

The payload for coil wiring has 16 bytes and is explained below. Each 2 letters represent a byte:

1st word: BB ?? ?? ?? C1 C1 C2 C2

2nd word: C3 C3 C4 C4 C5 C5 ?? ??

BB is the byte mask for which coil is active. Combinations are achieved via OR:

- coil 1 -> 0x01
- coil 2 -> 0x02
- coil 3 -> 0x04
- coil 4 -> 0x08
- coil 5 -> 0x10
- Piezo  -> 0x40
- Mute   -> 0x80

The HH and HHP guitars have 4 coils, the latter having the piezo as well. The HSH and HSHP have 5 coils, the latter having the piezo too. They coils are numbered in ascending order, the bridge being the first and the neck being the last one. Humbuckers count obviously for 2 coils.

Each coil has 4 nibbles for setup and they are split as follows:

BYTE0 BYTE1
N0_N1 N2_N3

N0 and N2 are points where the coils are connected. They go from 0 (ground) to number of string (6 in the case of guitar).
If a coil is in phase, the connection goes from N0 (lower) to N2. If it is out of phase, it goes from N2 (lower) to N0 (higher).
Assuming the case of a 6 string guitar, we have the following examples:

- coil in phase and in parallel: N0 = 0 (ground) N2 = 6 (last string)
- coil out of phase and in parallel: N0 = 6 (last string) N2 = 0 (ground)
- coil in phase and in series from string 1 to string 4: N0 = 1 (lower E string)  N2 = 4 (G string)
- coil out phase and in series from string 3 to string 5: N0 = 5 (B string) N2 = 3 (D string)

Also note that in order for a coil configuration to be valid, we need to make sure that the connections in series are well formed, that is, that they form a closed path. 

The nibbles N1 and N3 seem to have hardcoded values for each coil. Current investigations leads to following values:
- if coil 1 active: N1 = 0x0, N3 = 0x1
- if coil 2 active: N1 = 0x2, N3 = 0x3
- if coil 3 active: N1 = 0x4, N3 = 0x5
- if coil 4 active: N1 = 0x8, N3 = 0x9
- if coil 5 active: N1 = 0xA, N3 = 0xB

Below are examples of valid series connections for a 6 string guitar:

- coil 1 in phase in series from ground to string 1, 
  coil 2 in phase in series from string 1 to string 6

0: "0300000000111263"

1: "ffffffffffffffff"

- coil 1 in phase in series from ground to string 2, 
  coil 2 in phase in series from string s to string 6

0: "0300000000212263"

1: "ffffffffffffffff"

- coil 1 out of phase phase in series from ground to string 1, 
  coil 2 in phase in series from string 1 to string 6

0: "0300000010011263"

1: "ffffffffffffffff"

- coil 1 in phase in series from ground to string 2, 
  coil 2 out of phase in series from string s to string 6

0: "0300000000216223"

1: "ffffffffffffffff"

- coil 1 in phase in series from ground to string 1, 
  coil 2 in phase in series from string 1 to string 2, 
  coil 3 in phase in series from string 2 to string 6

0: "0700000000111223"

1: "2465ffffffffffff"

- coil 1 in phase in series from ground to string 2, 
  coil 2 in phase in series from string 2 to string 6,
  (in parallel with)
  coil 5 in phase in series from ground to string 2, 
  coil 4 out of phase in series from string 2 to string 6, 

0: "1b00000000212263"

1: "ffff68290a2bffff"

## Disclaimer

I do not own the original code, nor was I part of its development, so this software is to be used "as is". I am also not responsible for any damage that this software might cause to your instrument. This code is under MIT license and is free to be shared, used and improved by anyone.

## TODOs
Currently lots of :) Here are the first ones that come to mind:
- Manage dirty flag when saving, opening and plugging the instrumenr
- Warnings for overwrite on read from instrument or connect
- undo/redo
- Instrument/PC data set sync
- Logo
- Remove any AJAX dependency
- Get rid of browser.js
- Clean up
