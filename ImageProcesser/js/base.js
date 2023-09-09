(function(imageproc) {
    "use strict";

    /*
     * Apply negation to the input data
     */
    imageproc.negation = function(inputData, outputData) {
        console.log("Applying negation...");

        for (var i = 0; i < inputData.data.length; i += 4) {
            outputData.data[i]     = 255 - inputData.data[i];
            outputData.data[i + 1] = 255 - inputData.data[i + 1];
            outputData.data[i + 2] = 255 - inputData.data[i + 2];
        }
    }

    /*
     * Convert the input data to grayscale
     */
    imageproc.grayscale = function(inputData, outputData) {
        console.log("Applying grayscale...");

        for (var i = 0; i < inputData.data.length; i += 4) {
            // Find the grayscale value using simple averaging
            let simple_average = parseInt((inputData.data[i] + inputData.data[i+1] + inputData.data[i+2])/3)
            // Change the RGB components to the resulting value

            outputData.data[i]     = simple_average;
            outputData.data[i + 1] = simple_average;
            outputData.data[i + 2] = simple_average;
        }
    }

    /*
     * Applying brightness to the input data
     */
    imageproc.brightness = function(inputData, outputData, offset) {
        console.log("Applying brightness...");

        for (var i = 0; i < inputData.data.length; i += 4) {
            // Change the RGB components by adding an offset
            for (var j = 0; j<=2; j++){
                if (inputData.data[i+j] + offset > 255)
                    outputData.data[i+j]     = 255
                else if (inputData.data[i+j] + offset < 0)
                    outputData.data[i+j]     = 0
                else
                    outputData.data[i+j]     = inputData.data[i+j] + offset ;
            }


            // Handle clipping of the RGB components
        }
    }

    /*
     * Applying contrast to the input data
     */
    imageproc.contrast = function(inputData, outputData, factor) {
        console.log("Applying contrast...");

        for (var i = 0; i < inputData.data.length; i += 4) {
            // Change the RGB components by multiplying a factor

            outputData.data[i]     = inputData.data[i] * factor;
            outputData.data[i + 1] = inputData.data[i + 1] * factor;
            outputData.data[i + 2] = inputData.data[i + 2] * factor;

            // Handle clipping of the RGB components
            for (var j =0; j<=2; j++){
                if (outputData.data[i+j] > 255)
                    outputData.data[i+j] = 255
                else if(outputData.data[i+j] < 0)
                    outputData.data[i+j] = 0
                else
                    continue
            }
        }
    }

    /*
     * Make a bit mask based on the number of MSB required
     */
    function makeBitMask(bits) {
        var mask = 0;
        for (var i = 0; i < bits; i++) {
            mask >>= 1;
            mask |= 128;
        }
        return mask;
    }

    /*
     * Apply posterization to the input data
     */
    imageproc.posterization = function(inputData, outputData,
                                       redBits, greenBits, blueBits) {
        console.log("Applying posterization...");

        // Create the red, green and blue masks
        // A function makeBitMask() is already given

        for (var i = 0; i < inputData.data.length; i += 4) {
            // Apply the bitmasks onto the RGB channels

            outputData.data[i]     = inputData.data[i] & makeBitMask(redBits);
            outputData.data[i + 1] = inputData.data[i + 1] & makeBitMask(greenBits);
            outputData.data[i + 2] = inputData.data[i + 2] & makeBitMask(blueBits);
        }
    }

    /*
     * Apply threshold to the input data
     */
    imageproc.threshold = function(inputData, outputData, thresholdValue) {
        console.log("Applying thresholding...");

        for (var i = 0; i < inputData.data.length; i += 4) {
            // Find the grayscale value using simple averaging
            // You will apply thresholding on the grayscale value
            let simple_average = parseInt((inputData.data[i] + inputData.data[i+1] + inputData.data[i+2])/3)

            let tool = 0
            if (simple_average < thresholdValue)
                tool = 0 
            else
                tool = 255

            // Change the colour to black or white based on the given threshold
            outputData.data[i]     = tool
            outputData.data[i + 1] = tool
            outputData.data[i + 2] = tool
        }
    }

    /*
     * Build the histogram of the image for a channel
     */
    function buildHistogram(inputData, channel) {
        var histogram = [];
        for (var i = 0; i < 256; i++)
            histogram[i] = 0;

        /**
         * TODO: You need to build the histogram here
         */
        if (channel == "gray")
        {
            for (let i =0; i<inputData.data.length; i+=4){
                let simpleAverage = parseInt((inputData.data[i]+inputData.data[i+1]+inputData.data[i+2])/3)
                histogram[simpleAverage]++
            
            }
        }
        else if (channel == "red"){
            for (let i =0; i<inputData.data.length; i+=4){
                let red = inputData.data[i]
                histogram[red]++
            }
        }
        else if (channel == "green"){
            for (let i =0; i<inputData.data.length; i+=4){
                let green = inputData.data[i+1]
                histogram[green]++
            }
        }
        else if (channel == "blue"){
            for (let i =0; i<inputData.data.length; i+=4){
                let blue = inputData.data[i+2]
                histogram[blue]++
            }
        }

        // Accumulate the histogram based on the input channel
        // The input channel can be:
        // "red"   - building a histogram for the red component
        // "green" - building a histogram for the green component
        // "blue"  - building a histogram for the blue component
        // "gray"  - building a histogram for the intensity
        //           (using simple averaging)

        return histogram;
    }

    /*
     * Find the min and max of the histogram
     */
    function findMinMax(histogram, pixelsToIgnore) {
        var min = 0, max = 255;


        // Find the minimum in the histogram with non-zero value by
        // ignoring the number of pixels given by pixelsToIgnore
        let tmp = pixelsToIgnore
        for (min = 0; min < 255; min++) {
            if (histogram[min] > 0) {
                
                if (histogram[min] > tmp)break;
                tmp-=histogram[min];
            }
        }
        // Find the maximum in the histogram with non-zero value by
        // ignoring the number of pixels given by pixelsToIgnore
        
        tmp = pixelsToIgnore
        for (max; max > 0; max--) {
            if (histogram[max] >0 ){ 
                if (histogram[max] > tmp) break;
                tmp-=histogram[max]
            }
        }
        
        
        return {"min": min, "max": max};
    }
    
    /*
     * Apply automatic contrast to the input data
     */
    
    imageproc.autoContrast = function(inputData, outputData, type, percentage) {
        console.log("Applying automatic contrast...");

        // Find the number of pixels to ignore from the percentage
        var pixelsToIgnore = (inputData.data.length / 4) * percentage;

        var histogram, minMax;
        if (type == "gray") {
            // Build the grayscale histogram
            histogram = buildHistogram(inputData, "gray");
            // console.log(histogram.slice(0, 10).join(","));

            // Find the minimum and maximum grayscale values with non-zero pixels
            minMax = findMinMax(histogram, pixelsToIgnore);
            // console.log(minMax)

            var min = minMax.min, max = minMax.max, range = max - min;


            for (var i = 0; i < inputData.data.length; i += 4) {
                // Adjust each pixel based on the minimum and maximum values

                outputData.data[i]     = (inputData.data[i] - min) / range * 255;
                outputData.data[i + 1] = (inputData.data[i + 1] - min)/range*255;
                outputData.data[i + 2] = (inputData.data[i + 2]-min)/range*255;

                //clipping handling
                for (var j =0; j<=2; j++){
                    if (outputData.data[i+j] > 255)
                        outputData.data[i+j] = 255
                    else if(outputData.data[i+j] < 0)
                        outputData.data[i+j] = 0
                    else
                        continue
                }
            }
        }
        else {

            let redHistogram = buildHistogram(inputData, "red");
            let greenHistogram = buildHistogram(inputData, "green");
            let blueHistogram = buildHistogram(inputData, "blue");

            let redminMax = findMinMax(redHistogram, pixelsToIgnore);
            let greenminMax = findMinMax(greenHistogram, pixelsToIgnore);
            let blueminMax = findMinMax(blueHistogram, pixelsToIgnore);

            for (var i = 0; i < inputData.data.length; i += 4) {
                // Adjust each channel based on the histogram of each one

                outputData.data[i]     = (inputData.data[i] - redminMax.min)/(redminMax.max-redminMax.min)*255;
                outputData.data[i + 1] = (inputData.data[i + 1]- greenminMax.min)/(greenminMax.max-greenminMax.min)*255;
                outputData.data[i + 2] = (inputData.data[i + 2]- blueminMax.min)/(blueminMax.max-blueminMax.min)*255;
            }
        }
    }

}(window.imageproc = window.imageproc || {}));
