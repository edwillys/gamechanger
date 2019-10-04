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

In order to install and run this application you will need npm. It should be cross platform, though most of the tests are being done under Linux and some tests on Windows. Almost no tests were done on Mac.

### Install the app
```
npm install
```

### Build the node-usb
```
./node_modules/.bin/electron.rebuild
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

TODO: extend this table...

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
