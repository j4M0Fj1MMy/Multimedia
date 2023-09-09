(function(imageproc) {
    "use strict";

    /*
     * Apply sobel edge to the input data
     */
    imageproc.sobelEdge = function(inputData, outputData, threshold) {
        // console.log("Applying Sobel edge detection...");

        /* Initialize the two edge kernel Gx and Gy */
        var Gx = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        var Gy = [
            [-1,-2,-1],
            [ 0, 0, 0],
            [ 1, 2, 1]
        ];

        /**
         * Done: You need to write the code to apply
         * the two edge kernels appropriately
         */
        
        
        for (var y = 0; y < inputData.height; y++) {
            for (var x = 0; x < inputData.width; x++) {

                
                var pixel1 = imageproc.getPixel(inputData, x + 1, y );
                var pixel2 = imageproc.getPixel(inputData, x - 1, y );
                var pixel3 = imageproc.getPixel(inputData, x + 1, y -1);//bot-right
                var pixel4 = imageproc.getPixel(inputData, x - 1, y -1);//bot-left
                var pixel5 = imageproc.getPixel(inputData, x + 1, y +1);//top-right
                var pixel6 = imageproc.getPixel(inputData, x - 1, y +1);//top-left

                var gxr = 2*pixel1.r-2*pixel2.r+pixel3.r-pixel4.r+pixel5.r-pixel6.r
                var gxg = 2*pixel1.g-2*pixel2.g+pixel3.g-pixel4.g+pixel5.g-pixel6.g
                var gxb = 2*pixel1.b-2*pixel2.b+pixel3.b-pixel4.b+pixel5.b-pixel6.b

                var pixel7=imageproc.getPixel(inputData, x , y+1 );//mid-top
                var pixel8=imageproc.getPixel(inputData, x , y-1 );//mid-bot
                var gyr = 2*pixel8.r-2*pixel7.r+pixel3.r+pixel4.r-pixel5.r-pixel6.r
                var gyg = 2*pixel8.g-2*pixel7.g+pixel3.g+pixel4.g-pixel5.g-pixel6.g
                var gyb = 2*pixel8.b-2*pixel7.b+pixel3.b+pixel4.b-pixel5.b-pixel6.b

                var i = (x + y * outputData.width) * 4;
                outputData.data[i]     = Math.hypot(gxr,gyr)>threshold?255:0
                outputData.data[i + 1] = Math.hypot(gxg,gyg)>threshold?255:0
                outputData.data[i + 2] = Math.hypot(gxb,gyb)>threshold?255:0
            }
        }
    } 

}(window.imageproc = window.imageproc || {}));
