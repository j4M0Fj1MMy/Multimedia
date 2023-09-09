(function(imageproc) {
    "use strict";

    /*
     * Apply blur to the input data
     */
    imageproc.blur = function(inputData, outputData, kernelSize) {
        console.log("Applying blur...");

        // You are given a 3x3 kernel but you need to create a proper kernel
        // using the given kernel size
        var kernel = [ [1, 1, 1], [1, 1, 1], [1, 1, 1] ];

        // Apply the kernel to the whole image
        for (var y = 0; y < inputData.height; y++) {
            for (var x = 0; x < inputData.width; x++) {
                // Use imageproc.getPixel() to get the pixel values
                // over the kernel
                let pixel = {r:0,g:0,b:0,a:0}
                let bound = (kernelSize-1)/2
                for(let m = -bound; m<=bound;m++){
                    for(let n=-bound;n<=bound;n++){
                        let tmp = imageproc.getPixel(inputData,x+m,y+n)
                        pixel.r += tmp.r
                        pixel.g += tmp.g
                        pixel.b += tmp.b
                        pixel.a += tmp.a
                    }
                }
                pixel.r /= kernelSize*kernelSize
                pixel.g /= kernelSize*kernelSize
                pixel.b /= kernelSize*kernelSize
                pixel.a /= kernelSize*kernelSize

                // Then set the blurred result to the output data
                
                var i = (x + y * outputData.width) * 4;
                outputData.data[i]     = pixel.r;
                outputData.data[i + 1] = pixel.g;
                outputData.data[i + 2] = pixel.b;
            }
        }
    } 

}(window.imageproc = window.imageproc || {}));
