<script>

</script>

<div id="loader"></div>
<div id="background"></div>

<style>

    #loader {
        position: absolute;
        display: inline-block;
        left: 50%;
        top: 50%;
        margin-left: -76px;
        margin-top: -76px;
        border: 16px solid #f3f3f3; /* Light grey */
        border-top: 16px solid var(--main-color); /* Blue */
        border-radius: 50%;
        width: 120px;
        height: 120px;
        animation: spin 2s linear infinite;
        z-index: 11;
    }

    #background {
        position: absolute;
        top: 0px;
        left: 0px;
        right: 0px;
        bottom: 0px;
        z-index: 10;
        background-color: #fff;
        opacity: 1.0;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

</style>