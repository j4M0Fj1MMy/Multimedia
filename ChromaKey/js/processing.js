var currentEffect = null; // The current effect applying to the videos

var outputDuration = 0; // The duration of the output video
var outputFramesBuffer = []; // The frames buffer for the output video
var currentFrame = 0; // The current frame being processed
var completedFrames = 0; // The number of completed frames

// This function starts the processing of an individual frame.
function processFrame() {
    if (currentFrame < outputDuration) {
        currentEffect.process(currentFrame);
        currentFrame++;
    }
}

// This function is called when an individual frame is finished.
// If all frames are completed, it takes the frames stored in the
// `outputFramesBuffer` and builds a video. The video is then set as the 'src'
// of the <video id='output-video'></video>.
function finishFrame() {
    completedFrames++;
    if (completedFrames < outputDuration) {
        updateProgressBar("#effect-progress", completedFrames / outputDuration * 100);

        if (stopProcessingFlag) {
            stopProcessingFlag = false;
            $("#progress-modal").modal("hide");
        } else {
            setTimeout(processFrame, 1);
        }
    }
    else {
        buildVideo(outputFramesBuffer, function(resultVideo) {
            $("#output-video").attr("src", URL.createObjectURL(resultVideo));
            updateProgressBar("#effect-progress", 100);
            $("#progress-modal").modal("hide");
        });
    }
}

// Definition of various video effects
//
// `effects` is an object with unlimited number of members.
// Each member of `effects` represents an effect.
// Each effect is an object, with two member functions:
// - setup() which responsible for gathering different parameters
//           of that effect and preparing the output buffer
// - process() which responsible for processing of individual frame
var effects = {
    reverse: {
        setup: function() {
            // Initialize the duration of the output video
            outputDuration = input1FramesBuffer.length;

            // Prepare the array for storing the output frames
            outputFramesBuffer = new Array(outputDuration);
        },
        process: function(idx) {
            // Put the frames in reverse order
            outputFramesBuffer[idx] = input1FramesBuffer[(outputDuration - 1) - idx];

            // Notify the finish of a frame
            finishFrame();
        }
    },
    
    fadeInOut: {
        setup: function() {
            // Prepare the parameters
            this.fadeInDuration = Math.round(parseFloat($("#fadeIn-duration").val()) * frameRate);
            this.fadeOutDuration = Math.round(parseFloat($("#fadeOut-duration").val()) * frameRate);

            // Initialize the duration of the output video
            outputDuration = input1FramesBuffer.length;

            // Prepare the array for storing the output frames
            outputFramesBuffer = new Array(outputDuration);
        },
        process: function(idx) {
            // Use a canvas to store frame content
            var w = $("#input-video-1").get(0).videoWidth;
            var h = $("#input-video-1").get(0).videoHeight;
            var canvas = getCanvas(w, h);
            var ctx = canvas.getContext('2d');
            
            var multiplier = 1;
            if (idx < this.fadeInDuration) {
                // In the fade in region
                // multiplier = ...a value from 0 to 1...
                multiplier = idx/this.fadeInDuration;
            }
            else if (idx > outputDuration - this.fadeOutDuration) {
                // In the fade out region
                // multiplier = ...a value from 1 to 0...
                multiplier = (outputDuration-idx)/this.fadeOutDuration;
            }

            /*
             * TODO: Calculate the multiplier
             */

            
            // Modify the image content based on the multiplier
            var img = new Image();
            img.onload = function() {
                // Get the image data object
                ctx.drawImage(img, 0, 0);
                var imageData = ctx.getImageData(0, 0, w, h);


                /*
                 * TODO: Modify the pixels
                 */
                for (var i = 0; i < imageData.data.length; i += 4) {
                    imageData.data[i]     *= multiplier; // Red
                    imageData.data[i + 1] *= multiplier; // Green
                    imageData.data[i + 2] *= multiplier; // Blue
                    imageData.data[i + 3] *= multiplier; // Alpha
                }
                
                // Store the image data as an output frame
                ctx.putImageData(imageData, 0, 0);
                outputFramesBuffer[idx] = canvas.toDataURL("image/webp");

                // Notify the finish of a frame
                finishFrame();
            };
            img.src = input1FramesBuffer[idx];
        }
    },
    
    motionBlur: {
        setup: function() {
            // Prepare the parameters
            this.blurFrames = parseInt($("#blur-frames").val());

            // Initialize the duration of the output video
            outputDuration = input1FramesBuffer.length;

            // Prepare the array for storing the output frames
            outputFramesBuffer = new Array(outputDuration);

            // Prepare a buffer of frames (as ImageData)
            this.imageDataBuffer = [];
        },
        process: function(idx, parameters) {
            // Use a canvas to store frame content
            var w = $("#input-video-1").get(0).videoWidth;
            var h = $("#input-video-1").get(0).videoHeight;
            var canvas = getCanvas(w, h);
            var ctx = canvas.getContext('2d');
            
            // Need to store them as local variables so that
            // img.onload can access them
            var imageDataBuffer = this.imageDataBuffer;
            var blurFrames = this.blurFrames;

            // Combine frames into one
            var img = new Image();
            img.onload = function() {
                // Get the image data object of the current frame
                ctx.drawImage(img, 0, 0);
                var imageData = ctx.getImageData(0, 0, w, h);


                /*
                 * TODO: Manage the image data buffer
                 */
                imageDataBuffer.push(imageData);
                if (imageDataBuffer.length > blurFrames)
                    imageDataBuffer.shift();

                // Create a blank image data
                imageData = new ImageData(w, h);



                /*
                 * TODO: Combine the image data buffer into one frame
                 */
                for (var i = 0; i < imageData.data.length; i += 4) {

                    // ...Set the pixel to black...
                    imageData.data[i] = 0;
                    imageData.data[i+1] = 0;
                    imageData.data[i+2] = 0;
                    imageData.data[i+3] = 255;

                    for (var j = 0; j < imageDataBuffer.length; ++j) {

                        // ...Combine the pixels from the image data buffer...
                        imageData.data[i] += imageDataBuffer[j].data[i]/imageDataBuffer.length;
                        imageData.data[i+1] += imageDataBuffer[j].data[i+1]/imageDataBuffer.length;
                        imageData.data[i+2] += imageDataBuffer[j].data[i+2]/imageDataBuffer.length;

                    }
                    
                }

                // Store the image data as an output frame
                ctx.putImageData(imageData, 0, 0);
                outputFramesBuffer[idx] = canvas.toDataURL("image/webp");

                // Notify the finish of a frame
                finishFrame();
            };
            img.src = input1FramesBuffer[idx];
        }
    },
    earthquake: {
        setup: function() {
            // Prepare the parameters
            this.strength = parseInt($("#earthquake-strength").val());

            // Initialize the duration of the output video
            outputDuration = input1FramesBuffer.length;

            // Prepare the array for storing the output frames
            outputFramesBuffer = new Array(outputDuration);
        },
        process: function(idx, parameters) {
            // Use a canvas to store frame content
            var w = $("#input-video-1").get(0).videoWidth;
            var h = $("#input-video-1").get(0).videoHeight;
            var canvas = getCanvas(w, h);
            var ctx = canvas.getContext('2d');
            

            /*
             * TODO: Calculate the placement of the output frame
             */
            dx = Math.random()*2*this.strength;
            dy = Math.random()*2*this.strength;
            sw = w - 2 * this.strength;
            sh = h - 2 * this.strength;
            // Draw the input frame in a new location and size
            var img = new Image();
            img.onload = function() {
            

                /*
                 * TODO: Draw the input frame appropriately
                 */

                ctx.drawImage(img, dx, dy, sw, sh, 0, 0, w, h);
                outputFramesBuffer[idx] = canvas.toDataURL("image/webp");

                // Notify the finish of a frame
                finishFrame();
            };
            img.src = input1FramesBuffer[idx];
        }
    },
    crossFade: {
        setup: function() {
            // Prepare the parameters
            this.crossFadeDuration =
                Math.round(parseFloat($("#crossFade-duration").val()) * frameRate);

            /*
             * TODO: Prepare the duration and output buffer
             */
            outputDuration = input1FramesBuffer.length + input2FramesBuffer.length - this.crossFadeDuration;

            outputFramesBuffer = new Array(outputDuration);

        },
        process: function(idx) {
            /*
             * TODO: Make the transition work
             */

            var w = $("#input-video-1").get(0).videoWidth;
            var h = $("#input-video-1").get(0).videoHeight;
            var canvas = getCanvas(w, h);
            var ctx = canvas.getContext('2d');
            var cfd = this.crossFadeDuration;

            if (idx < (input1FramesBuffer.length - cfd)) {
                outputFramesBuffer[idx] = input1FramesBuffer[idx];
                
            }

            else if (idx < input1FramesBuffer.length) {
                var multiplier1 = 1;
                if (idx > (input1FramesBuffer.length-cfd) && idx < input1FramesBuffer.length) {
                    // In the fade out region
                    // multiplier = ...a value from 1 to 0...
                    multiplier1 = (input1FramesBuffer.length-idx)/cfd;
                }
                var multiplier2 = 1-multiplier1;
                
                var img1 = new Image();
                img1.onload = function() {
                    ctx.drawImage(img1, 0, 0);
                    var imageData1 = ctx.getImageData(0, 0, w, h);
                    for (var i = 0; i < imageData1.data.length; i += 4) {
                        imageData1.data[i] *= multiplier1;
                        imageData1.data[i+1] *= multiplier1;
                        imageData1.data[i+2] *= multiplier1;
                    }
                    ctx.putImageData(imageData1, 0, 0);

                    var img2 = new Image();
                    img2.onload = function(){
                        ctx.drawImage(img2, 0, 0);
                        var imageData2 = ctx.getImageData(0, 0, w, h);

                        for (var i = 0; i < imageData2.data.length; i += 4) {
                            imageData2.data[i] = imageData2.data[i]*multiplier2 + imageData1.data[i];
                            imageData2.data[i+1] = imageData2.data[i+1]*multiplier2 + imageData1.data[i+1];
                            imageData2.data[i+2] = imageData2.data[i+2]*multiplier2 + imageData1.data[i+2];
                        }
                        
                        ctx.putImageData(imageData2, 0, 0);
                        outputFramesBuffer[idx] = canvas.toDataURL("image/webp");
                        
                    }
                    img2.src = input2FramesBuffer[idx - input1FramesBuffer.length + cfd];
                };
            
                img1.src = input1FramesBuffer[idx];

            }

            else { 
                outputFramesBuffer[idx] =  input2FramesBuffer[idx - input1FramesBuffer.length + cfd];
                
            }

            finishFrame();
        }
    },

    // Chroma key operation
    chromaKey: {
        setup: function() {
            // Assume length is same
            outputDuration = input1FramesBuffer.length;

            // Prepare the array for storing the output frames
            outputFramesBuffer = new Array(outputDuration);

            method = $("#chromaKey-method").val();
            color = hexTorgb($("#chromaKey-color").val())

            // threshold for hue or k for vlahos
            value = $("#chromaKey-value").val();
      

            // Selected key color
            r = color[0];
            g = color[1];
            b = color[2];

            if (method == "hue"){
                hsv = fromRGBToHSV(r,g,b);
                h = hsv.h;
                s = hsv.s;
                v = hsv.v;
            }
            
        },
        process: function(idx) {
            
            // Hue value comparison
            if (method == "hue"){
                // usual settings
                var w = $("#input-video-1").get(0).videoWidth;
                var h = $("#input-video-1").get(0).videoHeight;
                var canvas = getCanvas(w, h);
                var ctx = canvas.getContext('2d' ,{ willReadFrequently: true });
                var k = value;
                var edge = $("#chromaKey-hue-option").val();
                
                var color = hexTorgb($("#chromaKey-color").val());
                // console.log(color);

                // getting the pixels from 2 videos
                var imageData1;
                var imageData2;
                var img1 = new Image();
                img1.onload = function() {
                    ctx.drawImage(img1, 0, 0);
                    imageData1 = ctx.getImageData(0, 0, w, h);

                    var img2 = new Image();
                    img2.onload = function() {
                        ctx.drawImage(img2, 0, 0);
                        imageData2 = ctx.getImageData(0, 0, w, h);

                        // starting the green screne operation, assuming same size
                        // since we need blur, need to work with mask, cannot just overwrite
                        var mask = [];
                        for (var i = 0; i < imageData2.data.length; i += 4) {
                            // 1st hsv
                            var hsv1 = fromRGBToHSV(imageData1.data[i],imageData1.data[i+1],imageData1.data[i+2]);
                            var h1 = hsv1.h;

                            // 2nd hsv
                            var hsv2 = fromRGBToHSV(color[0],color[1],color[2]);
                            var h2 = hsv2.h;

                            var deltaH;
                            // computing according to the definition from notes
                            if (Math.abs(h2-h1) < 180) {
                                deltaH = Math.abs(h2-h1)/180;
                            }
                            else {// Math.abs(h2-h1) >= 180
                                deltaH = (360-Math.abs(h2-h1))/180;
                            }

                            // 0 means 2 are the same, 1 means very different
                            if (deltaH <= 0.2) {
                                //using imageData2(background) as output, 
                                //if < threshold(green), ignore, don't put green on top 
                                mask[i] = 0;
                            }
                            else {
                                //very different
                                // place the pixel on top of the background
                                if (edge == 'hard'){
                                    imageData2.data[i] = imageData1.data[i]
                                    imageData2.data[i+1] = imageData1.data[i+1]
                                    imageData2.data[i+2] = imageData1.data[i+2]
                                }
                                mask[i] = 1;
                            }
                            
                        }
                        // console.log(mask)
                        //blur the mask, from lab5
                        getMask = function(imageData, x, y, border) {
                            // Handle the boundary cases
                            if (x < 0)
                                x = (border=="wrap")? imageData.width + (x % imageData.width) : 0;
                            if (x >= imageData.width)
                                x = (border=="wrap")? x % imageData.width : imageData.width - 1;
                            if (y < 0)
                                y = (border=="wrap")? imageData.height + (y % imageData.height) : 0;
                            if (y >= imageData.height)
                                y = (border=="wrap")? y % imageData.height : imageData.height - 1;
                    
                            var i = (x + y * imageData.width) * 4;
                            return {
                                a: mask[i]
                            };
                        }

                        if (edge == 'smooth')
                        {   
                            var kernelSize = 5;
                            let bound = (kernelSize-1)/2
                            for (var y = 0; y < imageData1.height; y++) {
                                for (var x = 0; x < imageData1.width; x++) {

                                    var alphaComp = 0
                                    for(let m = -bound; m<=bound;m++){
                                        for(let n=-bound;n<=bound;n++){
                                            let tmp = getMask(imageData1,x+m,y+n)
                                            alphaComp += tmp.a
                                            
                                        }
                                    }
                                    alphaComp /= kernelSize*kernelSize;
                                    
                                    alphaComp -= 0.1;
                                    if (alphaComp <0)
                                        alphaComp = 0;
                                    

                                    var i = (x + y * imageData1.width) * 4;
                                    // Then set the blurred result to the output data
                                    imageData2.data[i] = imageData1.data[i]*alphaComp+imageData2.data[i]*(1-alphaComp);
                                    imageData2.data[i+1] = imageData1.data[i+1]*alphaComp+imageData2.data[i+1]*(1-alphaComp);
                                    imageData2.data[i+2] = imageData1.data[i+2]*alphaComp+imageData2.data[i+2]*(1-alphaComp);
                                }
                            }
                        }


                        

                        ctx.putImageData(imageData2, 0, 0);
                        outputFramesBuffer[idx] = canvas.toDataURL("image/webp");
                        
                        finishFrame();
                    }
                    img2.src = input2FramesBuffer[idx];
                };
                img1.src = input1FramesBuffer[idx];

            }

            // Vlahos algorithm
            else {
                // Assume size is same
                var w = $("#input-video-1").get(0).videoWidth;
                var h = $("#input-video-1").get(0).videoHeight;
                var canvas = getCanvas(w, h);
                var ctx = canvas.getContext('2d');
                var k = value;

                var img = new Image();
                img.onload = function() {
                    // Get the image data object
                    ctx.drawImage(img, 0, 0);
                    var imageData1 = ctx.getImageData(0, 0, w, h);
                    // for (var i = 0; i < imageData1.data.length; i += 4) {
                    //     var alpha = (1 - ((imageData1.data[i + 1] - k * imageData1.data[i + 2]) / (g - k*b)));

                    //     // imageData1.data[i]     = (imageData1.data[i] - r*(1-alpha)) ; // Red
                    //     // imageData1.data[i + 1] = (imageData1.data[i + 1] - g*(1-alpha)) ; // Green
                    //     // imageData1.data[i + 2] = (imageData1.data[i + 2] - b*(1-alpha)) ; // Blue
                    // }
                    

                    var img2 = new Image();
                    img2.onload = function(){
                        ctx.drawImage(img2, 0, 0);
                        var imageData2 = ctx.getImageData(0, 0, w, h);
                        for (var i = 0; i < imageData2.data.length; i += 4) {
                            
                            imageData2.data[i] = (imageData1.data[i] - r*(1-(1 - ((imageData1.data[i + 1] - k * imageData1.data[i + 2]) / (g - k*b))))) + imageData2.data[i]*(1-(1 - ((imageData1.data[i + 1] - k * imageData1.data[i + 2]) / (g - k*b))));
                            imageData2.data[i+1] = (imageData1.data[i + 1] - g*(1-(1 - ((imageData1.data[i + 1] - k * imageData1.data[i + 2]) / (g - k*b))))) + imageData2.data[i+1]*(1-(1 - ((imageData1.data[i + 1] - k * imageData1.data[i + 2]) / (g - k*b))));
                            imageData2.data[i+2] =  (imageData1.data[i + 2] - b*(1-(1 - ((imageData1.data[i + 1] - k * imageData1.data[i + 2]) / (g - k*b))))) + imageData2.data[i+2]*(1-(1 - ((imageData1.data[i + 1] - k * imageData1.data[i + 2]) / (g - k*b))));
                        }
                        
                        ctx.putImageData(imageData2, 0, 0);
                        outputFramesBuffer[idx] = canvas.toDataURL("image/webp");
                        
                        // Notify the finish of a frame
                        finishFrame();
                        
                    }
                    img2.src = input2FramesBuffer[idx];

                };
                img.src = input1FramesBuffer[idx];

            }
        }
    }
};

// Handler for the "Apply" button click event
function applyEffect(e) {
    $("#progress-modal").modal("show");
    updateProgressBar("#effect-progress", 0);

    // Check which one is the actively selected effect
    switch(selectedEffect) {
        case "fadeInOut":
            currentEffect = effects.fadeInOut;
            break;
        case "reverse":
            currentEffect = effects.reverse;
            break;
        case "motionBlur":
            currentEffect = effects.motionBlur;
            break;
        case "earthquake":
            currentEffect = effects.earthquake;
            break;
        case "crossFade":
            currentEffect = effects.crossFade;
            break;
        case "chromaKey":
            currentEffect = effects.chromaKey;
            break;
        default:
            // Do nothing
            $("#progress-modal").modal("hide");
            return;
    }

    // Set up the effect
    currentEffect.setup();

    // Start processing the frames
    currentFrame = 0;
    completedFrames = 0;
    processFrame();
}

function hexTorgb(hex) {
    return ['0x' + hex[1] + hex[2] | 0, '0x' + hex[3] + hex[4] | 0, '0x' + hex[5] + hex[6] | 0];
}

// from lab 5
function  fromRGBToHSV(r, g, b) {
    r /= 255, g /= 255, b /= 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if (max == min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h *= 60;
    }

    return {"h": h, "s": s, "v": v};
}