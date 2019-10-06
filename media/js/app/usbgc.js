(function ($) {

    const usb = require('usb')
    const USB_VENDOR_GC = 9086
    const USB_PRODUCT_GC = 1

    let usbHandler = null, outEndpoint = null, inEndpoint = null, usbReady = false;
    var gc = window.gc;
    var plugin = gc.plugin;
    var usbgc = gc.usbgc;

    var usbGCProtocol = {
        'mute_on': { req: 0x16, res: 0x96, lenRes: 0 },
        'mute_off': { req: 0x17, res: 0x97, lenRes: 0 },
        'read_instrument_config': { req: 0x00, res: 0x80, lenRes: 15 },
        'read_instrument_memory': { req: 0x01, res: 0x81, lenRes: 9 },
        'read_battery': { req: 0x0A, res: 0x8A, lenRes: 1 },
        'read_instrument_behavior': { req: 0x02, res: 0x82, lenRes: 12 },
        'write_instrument_behavior': { req: 0x0D, res: 0x8D, lenRes: 0 },
        'read_scheme_banks_id': { req: 0x03, res: 0x83, lenRes: 16 },
        'write_scheme_banks_id': { req: 0x0E, res: 0x8E, lenRes: 0 },
        'read_preset_id': { req: 0x04, res: 0x84, lenRes: 2 },
        'write_preset_id': { req: 0x0F, res: 0x8F, lenRes: 0 },
        'read_preset': { req: 0x05, res: 0x85, lenRes: 16 },
        'write_preset': { req: 0x10, res: 0x90, lenRes: 0 },
        'read_midi_scheme_id': { req: 0x06, res: 0x86, lenRes: 8 },
        'write_midi_scheme_id': { req: 0xFF, res: 0xFF, lenRes: 0 },
        'read_midi_in_slot': { req: 0x07, res: 0x87, lenRes: 4 },
        'write_midi_in_slot': { req: 0xFF, res: 0xFF, lenRes: 0 },
        'read_midi_out_slot': { req: 0x08, res: 0x88, lenRes: 4 },
        'write_midi_out_slot': { req: 0xFF, res: 0xFF, lenRes: 0 },
        //'write_audition_sync': { req: 0x15, res: 0x95, lenRes: 0 },
        'write_audition_sync': { req: 0xFF, res: 0xFF, lenRes: 0 }, // TODO
        'write_audition': { req: 0x15, res: 0x95, lenRes: 0 } 
    }

    var usbGCReceive = function (dataBuf) {
        gc.log.event('USB data received', dataBuf);
        var responseValid = false;
        for (var key in usbGCProtocol) {
            var val = usbGCProtocol[key];
            if (val.res == dataBuf[0]) {
                var msg = {
                    command: key,
                    data: gc.arrb2hexstr(dataBuf.slice(1, 1 + val.lenRes))
                }
                plugin.convey_message(msg);

                responseValid = true;
                break;
            }
        }
        if (!responseValid) {
            console.log("Unknown message received on USB: " + dataBuf[0]);
        }
    }

    $.extend(usbgc, {
        init: function () {
            // find correct usb handler
            usbHandler = usb.findByIds(USB_VENDOR_GC, USB_PRODUCT_GC);
            // open USB handler
            usbHandler.open();
            // Do not call kernel driver functionality when running on win32 : https://github.com/tessel/node-usb/pull/227
            if (process.platform !== "win32"){
                // detach any kernel driver, if active
                if (usbHandler.interfaces[0].isKernelDriverActive()) {
                    usbHandler.interfaces[0].detachKernelDriver();
                }
            }
            // claim interfaces
            usbHandler.interfaces[0].claim();
            // when new data comes in a data event will be fired on the receive endpoint
            inEndpoint = usbHandler.interfaces[0].endpoints[0];
            inEndpoint.transferType = usb.LIBUSB_TRANSFER_TYPE_INTERRUPT;
            // 128 seems to be a must, but the 3...
            inEndpoint.startPoll(3, 128);
            inEndpoint.on("data", function (dataBuf) {
                usbGCReceive(dataBuf)
            })
            inEndpoint.on('error', function (error) {
                console.log('Error at USB receive:' + error);
            });
            // output endpoint
            outEndpoint = usbHandler.interfaces[0].endpoints[1];
            outEndpoint.on('error', function (error) {
                console.log('Error at USB transmit:' + error);
            });
            outEndpoint.on('end', function () {
                console.log('USB transmit has finished succesfully');
            });
            // ready to rock
            usbReady = true;
            //$('#global_container').add('object').attr('id', 'ebmmtgc');
        },
        send: function (msgId, payload = []) {
            if (usbReady) {
                if (msgId in usbGCProtocol) {
                    var req = [usbGCProtocol[msgId].req];
                    // 0xFF are commands that still have missing IDs
                    if (req != 0xFF){
                        var buf = Buffer.allocUnsafe(64)
                        buf[0] = req;
                        for (let i = 0; i < payload.length; i++) {
                            buf[1 + i] = payload[i];
                        }
                        gc.log.event('USB data sent', buf);
                        outEndpoint.transfer(buf, function (err) {
                            if ( err ){
                                console.log("USB transfer error:" + err);
                            }
                        });
                    }
                } else {
                    console.log("Message not found in USBGC protocol: " + msgId);
                }
            } else {
                console.log("Cannot tranfer USB data when USB handler not ready yet.")
            }
        },
    })

    // In this file you can include the rest of your app's specific main process
    // code. You can also put them in separate files and require them here.
    usb.on('attach', function (device) {
        if (device.deviceDescriptor.idVendor == USB_VENDOR_GC &&
            device.deviceDescriptor.idProduct == USB_PRODUCT_GC) {
            console.log("GC attached");
            try {
                usbgc.init();
                plugin.convey_message('device_connected');
            } catch (error) {
                console.log("Error at USB init on attaching:" + error)
            }
        }
    });

    usb.on('detach', function (device) {
        if (usbReady &&
            device.deviceDescriptor.idVendor == USB_VENDOR_GC &&
            device.deviceDescriptor.idProduct == USB_PRODUCT_GC) {
            console.log("GC detached");
            usbReady = false;

            inEndpoint = null;
            outEndpoint = null;
            try {
                usbHandler.close();    
            } catch (error) {
                console.log("Failed to close USB: " + error)
            }
            plugin.convey_message('device_not_connected');
        }
    });
})(jQuery);