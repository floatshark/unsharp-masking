(function () 
{

    const inputTextAmount = document.querySelector('#inputTextAmount');
    const inputRangeAmount = document.querySelector('#inputRangeAmount');
    let unsharpPower = inputTextAmount.value;

    const canvas = document.querySelector('#canvas');
    canvas.width = 500;
    canvas.height = 300;

    let imageWidth = 0;
    let imageHeight = 0;
    let cachedImage = undefined;
    let processedImage = undefined;

    let imgObject = new Image();
    const canvasContext = canvas.getContext('2d');

    document.querySelector('#inputImage').addEventListener('change', (event) => 
    {
        imgObject.src = "";
        const imageFile = event.target.files[0];
        if (null != imageFile) 
        {
            const blobUrl = window.URL.createObjectURL(imageFile);
            imgObject.src = blobUrl;
            imgObject.onload = function () 
            {
                imageWidth = imgObject.naturalWidth;
                imageHeight = imgObject.naturalHeight;
                canvas.width = imageWidth;
                canvas.height = imageHeight;
                canvasContext.drawImage(imgObject, 0, 0, imageWidth, imageHeight);
                cachedImage = canvasContext.getImageData(0, 0, imageWidth, imageHeight);
                processedImage = canvasContext.getImageData(0, 0, imageWidth, imageHeight);
            }
        }
    });

    inputTextAmount.addEventListener('change', (event) => 
    {
        unsharpPower = event.target.value;
        inputRangeAmount.value = unsharpPower;
    });

    inputRangeAmount.addEventListener('change', (event) =>
    { 
        unsharpPower = event.target.value;
        inputTextAmount.value = unsharpPower;
    });

    document.querySelector('#ok').addEventListener('click', () => 
    {
        if ("" != imgObject.src) 
        {
            for (var i = 0; i < processedImage.data.length; i++)
            {
                processedImage.data[i] = cachedImage.data[i];
            }
            applyUnsharpMasking(cachedImage, processedImage, 1.0, 1.0, unsharpPower);
            canvasContext.putImageData(processedImage, 0, 0);
        }
    });

    // reset image
    document.querySelector('#reset').addEventListener('click', () =>{
        if ("" != imgObject.src) 
        {
            canvasContext.putImageData(cachedImage, 0, 0);
        }
    })

    // Gaussian blur
    const applyGaussianBlur = function (originalImage, targetImage, size, sigma) 
    {
        const widthPxSize = targetImage.width;
        const heightPxSize = targetImage.height;

        const getGaussianFunctionValue = function (x) 
        {
            return (1 / Math.sqrt(2 * Math.PI * sigma * sigma)) * Math.exp(-x * x / (2 * sigma * sigma));
        }

        const getGaussianWidth = function () 
        {
            let ret = 0.0;
            for (let i = -size; i <= size; i++) 
            {
                ret += getGaussianFunctionValue(i, sigma);
            }
            return ret;
        }
        const gW = getGaussianWidth();

        const CalcurateGaussianBlur = function (idx) 
        {
            let ret = 0;
            for (var i = -size; i <= size; i++)
            {
                for (var j = -size; j <= size; j++)
                 {
                    if (originalImage.data[(idx + i * 4) + (j * widthPxSize * 4)] == undefined) 
                    {
                        ret += 0;
                    } else 
                    {
                        ret += (1 / gW) * getGaussianFunctionValue(i) * (1 / gW) * getGaussianFunctionValue(j) * originalImage.data[(idx + i * 4) + (j * widthPxSize * 4)];
                    }
                }
            }
            return ret;
        }

        for (let i = 0; i < widthPxSize; i++) 
        {
            for (let j = 0; j < heightPxSize; j++) 
            {
                let idx = (i + j * widthPxSize) * 4;
                targetImage.data[idx] = CalcurateGaussianBlur(idx);
                targetImage.data[idx + 1] = CalcurateGaussianBlur(idx + 1);
                targetImage.data[idx + 2] = CalcurateGaussianBlur(idx + 2);
                targetImage.data[idx + 3] = originalImage.data[idx + 3];
            }
        }
    }

    const applyUnsharpMasking = function (originalImage, targetImage, size, sigma, amount) 
    {
        // slow
        //const originalImage = JSON.parse(JSON.stringify(targetImage));

        const widthPxSize = targetImage.width;
        const heightPxSize = targetImage.width;

        applyGaussianBlur(originalImage, targetImage, size, sigma);
        
        const diffData = canvasContext.createImageData(widthPxSize, heightPxSize);
        for (let i = 0; i <= widthPxSize; i++) 
        {
            for (let j = 0; j <= heightPxSize; j++) 
            {
                let idx = (i + j * widthPxSize) * 4;
                for (let k = 0; k < 3; k++) 
                {
                    if (undefined != originalImage.data[idx + k] && undefined != targetImage.data[idx + k])
                    {
                        diffData.data[idx + k] = originalImage.data[idx + k] - targetImage.data[idx + k];
                    }
                }
            }
        }

        for (let i = 0; i < widthPxSize; i++) 
        {
            for (let j = 0; j < heightPxSize; j++) 
            {
                let idx = (i + j * widthPxSize) * 4;
                targetImage.data[idx] = originalImage.data[idx] + diffData.data[idx] * amount / 100;
                targetImage.data[idx + 1] = originalImage.data[idx + 1] + diffData.data[idx + 1] * amount / 100;
                targetImage.data[idx + 2] = originalImage.data[idx + 2] + diffData.data[idx + 2] * amount / 100;
            }
        }
    }

})();