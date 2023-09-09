// This object represent the waveform generator
var WaveformGenerator = {
    // The generateWaveform function takes 4 parameters:
    //     - type, the type of waveform to be generated
    //     - frequency, the frequency of the waveform to be generated
    //     - amp, the maximum amplitude of the waveform to be generated
    //     - duration, the length (in seconds) of the waveform to be generated
    generateWaveform: function(type, frequency, amp, duration) {
        var nyquistFrequency = sampleRate / 2; // Nyquist frequency
        var totalSamples = Math.floor(sampleRate * duration); // Number of samples to generate
        var result = []; // The temporary array for storing the generated samples

        switch(type) {
            case "sine-time": // Sine wave, time domain
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    result.push(amp * Math.sin(2.0 * Math.PI * frequency * currentTime));
                }
                break;

            case "square-time": // Square wave, time domain

                var oneCycle = sampleRate / frequency;
                var halfCycle = oneCycle / 2;
                for (var i = 0; i < totalSamples; i++) {
                    var whereInTheCycle = i % parseInt(oneCycle);
                    if (whereInTheCycle < halfCycle)
                    // first half of the cycle
                    result.push(amp); // Assume the highest value is amp
                    else
                    // second half of the cycle
                    result.push(-amp); // Assume the lowest value is -amp
                }
                break;

            case "square-additive": // Square wave, additive synthesis
                
                for (var i = 0; i < totalSamples; i++) {
                    var t = i / sampleRate;
                    var sample = 0;
                    var k = 1;
                    while (k * frequency < nyquistFrequency){
                        sample += (amp / k) * Math.sin(2 * Math.PI * k * frequency * t);
                        k += 2
                    }
                    
                    result.push(sample);
                }
                break;

            case "sawtooth-time": // Sawtooth wave, time domain

                var oneCycle = sampleRate / frequency;
                for (var i = 0; i < totalSamples; i++) {
                    var whereInTheCycle = i % parseInt(oneCycle);
                    var fractionInTheCycle = whereInTheCycle / oneCycle;
                    result.push(2 * (amp - amp*fractionInTheCycle) - amp);
                }
                break;

            case "sawtooth-additive": // Sawtooth wave, additive synthesis
                
                for (var i = 0; i < totalSamples; i++) {
                    var t = i / sampleRate;
                    var sample = 0;
                    var k = 1;
                    while (k * frequency < nyquistFrequency) {
                        sample += (amp / k) * Math.sin(2 * Math.PI * k * frequency * t);
                        k += 1
                    }
                    
                    result.push(sample);
                }
                break;

            case "triangle-additive": // Triangle wave, additive synthesis
                
                for (var i = 0; i < totalSamples; i++) {
                    var t = i / sampleRate;
                    var sample = 0;
                    var k = 1;

                    while(k * frequency < nyquistFrequency) {
                        sample += (amp / (k * k)) * Math.cos(2 * Math.PI * k * frequency * t);
                        k += 2
                    }

                    result.push(sample);
                }
                break;

            case "customized-additive-synthesis": // Customized additive synthesis

                // Obtain all the required parameters
				var harmonics = [];
				for (var h = 1; h <= 10; ++h) {
					harmonics.push($("#additive-f" + h).val());
				}

                for (var i = 0; i < totalSamples; i++) {
                    var t = i / sampleRate;
                    var sample = 0;
                    var k = 1;

                    while(k * frequency < nyquistFrequency && k <= 10) {
                        sample += amp * parseFloat(harmonics[k-1]) * Math.sin(2 * Math.PI * k * frequency * t);
                        k += 1;
                    }

                    result.push(sample);
                }

                break;

            case "white-noise": // White noise

                for (var i = 0; i < totalSamples; i++) {
                    result.push((Math.random()*2-1) * amp);
                }
                break;

            case "karplus-strong": // Karplus-Strong algorithm

                // Obtain all the required parameters
                var base = $("#karplus-base>option:selected").val();
                var b = parseFloat($("#karplus-b").val());
                var delay = parseInt($("#karplus-p").val());
                
                var freq = $("#karplus-use-freq").prop("checked");
                if (freq) {
                    delay = parseInt(sampleRate/frequency);
                }

                if (base == "white-noise"){
                    for (var i = 0; i < totalSamples; i++) {
                        if (i <= delay)
                            result.push(amp * (2 * Math.random() - 1));
                        else{
                            if (Math.random()<=b)
                                result.push(0.5 * (result[i-delay] + result[i-delay-1]));
                            else
                                result.push(-0.5 * (result[i-delay] + result[i-delay-1]));
                        }
                    }
                }

                else{
                    oneCycle = delay
                    for (var i = 0; i < totalSamples; i++) {
                        if (i <= delay){
                            var whereInTheCycle = i % parseInt(oneCycle);
                            var fractionInTheCycle = whereInTheCycle / oneCycle;
                            result.push(2 * (amp - amp*fractionInTheCycle) - amp);
                        }
                        else{
                            if (Math.random() <= b){
                                result.push(0.5 * (result[i-delay] + result[i-delay-1]));
                            }
                            else{
                                result.push(-0.5 * (result[i-delay] + result[i-delay-1]));
                            }    
                                
                        }
                    }
                }
                    

                break;

            case "fm": // FM

                // Obtain all the required parameters
                var carrierFrequency = parseInt($("#fm-carrier-frequency").val());
                var carrierAmplitude = parseFloat($("#fm-carrier-amplitude").val());
                var modulationFrequency = parseInt($("#fm-modulation-frequency").val());
                var modulationAmplitude = parseFloat($("#fm-modulation-amplitude").val());
                var useADSR = $("#fm-use-adsr").prop("checked");
                if(useADSR) { // Obtain the ADSR parameters
                    var attackDuration = parseFloat($("#fm-adsr-attack-duration").val()) * sampleRate;
                    var decayDuration = parseFloat($("#fm-adsr-decay-duration").val()) * sampleRate;
                    var releaseDuration = parseFloat($("#fm-adsr-release-duration").val()) * sampleRate;
                    var sustainLevel = parseFloat($("#fm-adsr-sustain-level").val()) / 100.0;
                }

                var freqMultiplier = $("#fm-use-freq-multiplier").prop("checked");
                if (freqMultiplier) {
                    carrierFrequency = parseFloat($("#fm-carrier-frequency").val());
                    modulationFrequency = parseFloat($("#fm-modulation-frequency").val());
                    carrierFrequency *= frequency;
                    modulationFrequency *= frequency;
                }

                //combining carrier and modulator 
                for (var i = 0; i < totalSamples; ++i) {
                    am = modulationAmplitude
                    if(useADSR){
                        if (i < attackDuration){
                            //attack
                            am *= i/attackDuration;
                        }
                        else if(i < attackDuration + decayDuration) {
                            //decay
                            var decayIndex = i - attackDuration;
                            var multiplier = 1 - decayIndex / decayDuration * (1-sustainLevel)
                            am *= multiplier;
                        }
                        else if (i < totalSamples - releaseDuration){
                            //sustain
                            am *= sustainLevel;
                        }
                        else {
                            //release
                            var releaseIndex = i - (totalSamples - releaseDuration);
                            var multiplier = 1 - releaseIndex / releaseDuration;
                            am *= sustainLevel * multiplier;
                        }
                    }
                    var currentTime = i / sampleRate;
                    var modulator = am * Math.sin(2.0 * Math.PI * modulationFrequency * currentTime);
                    result.push(amp*carrierAmplitude * Math.sin(2.0 * Math.PI * carrierFrequency * currentTime + modulator));
                }

            
                break;

            case "repeating-narrow-pulse": // Repeating narrow pulse
                var cycle = Math.floor(sampleRate / frequency);
                for (var i = 0; i < totalSamples; ++i) {
                    if(i % cycle === 0) {
                        result.push(amp * 1.0);
                    } else if(i % cycle === 1) {
                        result.push(amp * -1.0);
                    } else {
                        result.push(0.0);
                    }
                }
                break;

            default:
                break;
        }

        return result;
    }
};
