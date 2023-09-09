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
            

            /*
             * Done: Calculate the multiplier
             */
            var multiplier = 1;
            if (idx < this.fadeInDuration) {
                // In the fade in region
                multiplier = idx/this.fadeInDuration
            }
            else if (idx > outputDuration - this.fadeOutDuration) {
                // In the fade out region
                multiplier = 1 - (idx-(outputDuration - this.fadeOutDuration))/this.fadeOutDuration
                
            }


            // Modify the image content based on the multiplier
            var img = new Image();
            img.onload = function() {
                // Get the image data object
                ctx.drawImage(img, 0, 0);
                var imageData = ctx.getImageData(0, 0, w, h);


                /*
                 * Done: Modify the pixels
                 */
                for (var i = 0; i < imageData.data.length; i += 4) {
                    imageData.data[i]     = imageData.data[i]*multiplier; // Red
                    imageData.data[i + 1] = imageData.data[i + 1]*multiplier; // Green
                    imageData.data[i + 2] = imageData.data[i + 2]*multiplier // Blue
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
                 * Done: Manage the image data buffer
                 */
                imageDataBuffer.push(imageData);
                if (imageDataBuffer.length > blurFrames)
                    imageDataBuffer.shift();


                // Create a blank image data
                imageData = new ImageData(w, h);

                /*
                 * Done: Combine the image data buffer into one frame
                 */
                for (var i = 0; i < imageData.data.length; i += 4) {
                    // ...set black...
                    imageData.data[i]     = 0; // Red
                    imageData.data[i + 1] = 0; // Green
                    imageData.data[i + 2] = 0; // Blue
                    imageData.data[i + 3] = 255; // Aplha set 255

                    for (var j = 0; j < imageDataBuffer.length; ++j) {
                        // ...Combine the pixels from the image data buffer...
                        imageData.data[i]     += imageDataBuffer[j].data[i]/imageDataBuffer.length; // Red
                        imageData.data[i + 1] += imageDataBuffer[j].data[i+1]/imageDataBuffer.length; // Green
                        imageData.data[i + 2] += imageDataBuffer[j].data[i+2]/imageDataBuffer.length; // Blue
                
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
             * Done: Calculate the placement of the output frame
             */
            var strength = this.strength
            var dx = Math.random() * 2*strength//...a random number between 0 and 2 * strength...
            var dy = Math.random() * 2*strength//...a random number between 0 and 2 * strength... 
            var sw = w - 2 * strength
            var sh = h - 2 * strength

            // Draw the input frame in a new location and size
            var img = new Image();
            img.onload = function() {
            

                /*
                 * Done: Draw the input frame appropriately
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
             * Done: Prepare the duration and output buffer
             */
            // Initialize the duration of the output video
            outputDuration = input1FramesBuffer.length+input2FramesBuffer.length - this.crossFadeDuration;
            // console.log(outputDuration)

            // Prepare the array for storing the output frames
            outputFramesBuffer = new Array(outputDuration);


        },
        process: function(idx) {
            // Use a canvas to store frame content
            var w = $("#input-video-1").get(0).videoWidth;
            var h = $("#input-video-1").get(0).videoHeight;
            var canvas = getCanvas(w, h);
            var ctx = canvas.getContext('2d');

            /*
             * Done: Make the transition work
             */
            var crossFadeDuration = this.crossFadeDuration
            var left = input1FramesBuffer.length-crossFadeDuration

            if (idx < left) {
                //...copy the frame from input video 1 to the output frame...
                outputFramesBuffer[idx] = input1FramesBuffer[idx];
            }
            else if (idx < input1FramesBuffer.length) {
                //...combine the frames from input video 1 and video 2 into the output frame...
                var multiplier = 1
                if (idx>(left))
                
                    multiplier= (input1FramesBuffer.length-idx)/crossFadeDuration
                // console.log(multiplier)
                
                var multiplier2 = 1-multiplier

                
                var img1 = new Image();
                img1.onload = function() {
                    // Get the image data object
                    ctx.drawImage(img1, 0, 0);
                    var imageData = ctx.getImageData(0, 0, w, h);
    
                    for (var i = 0; i < imageData.data.length; i += 4) {
                        imageData.data[i]     = imageData.data[i]*multiplier; // Red
                        imageData.data[i + 1] = imageData.data[i + 1]*multiplier; // Green
                        imageData.data[i + 2] = imageData.data[i + 2]*multiplier // Blue
                    }
                    
                    ctx.putImageData(imageData, 0, 0);
                    
                    
                    var img2 = new Image();
                    img2.onload = function() {
                        // Get the image data object
                        
                        ctx.drawImage(img2, 0, 0);
                        var imageData2 = ctx.getImageData(0, 0, w, h);
                        
                        // console.log(imageData)
                        for (var i = 0; i < imageData2.data.length; i += 4) {
                            imageData2.data[i]     = imageData2.data[i]*multiplier2 + imageData.data[i]; // Red
                            imageData2.data[i + 1] = imageData2.data[i + 1]*multiplier2 + imageData.data[i+1]; // Green
                            imageData2.data[i + 2] = imageData2.data[i + 2]*multiplier2 + imageData.data[i+2] // Blue
                            imageData2.data[i + 3] = 255
                        }

                        
                        
                        // Store the image data as an output frame
                        ctx.putImageData(imageData2, 0, 0);
                        outputFramesBuffer[idx] = canvas.toDataURL("image/webp");
                    };
                    
                    img2.src = input2FramesBuffer[idx-left];
                };
                
                
                img1.src = input1FramesBuffer[idx];
                // console.log(idx-left)
                

            }
            else { // output frame must be in video 2 now
                //...copy the frame from input video 2 to the output frame...
                outputFramesBuffer[idx] = input2FramesBuffer[idx-left];
            }
            // console.log(idx)

            // Notify the finish of a frame
            finishFrame();

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
