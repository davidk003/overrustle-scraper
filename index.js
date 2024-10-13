const output = []
const currDate = new Date().toISOString().split('T')[0];
let startDate = new Date(1262332800).toISOString().split('T')[0];
let running = false;
let userName = ""
let endTime = new Date().getTime()
let maxLogs = 1_000_000_000

function outputLogsAsTxt()
{
    const text = output.join("\n");
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    a.download = `${userName}-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click(); // Simulate a click to trigger the download
    console.log("Dumped output")
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

const requestOptions = {
    method: "GET",
    redirect: "follow"
  };


function searchReq(searchAfterTime=0)
{
    fetch(`https://api-v2.rustlesearch.dev/anon/search?start_date=2010-01-01&end_date=${currDate}&channel=Destinygg&username=${userName}&search_after=${searchAfterTime}`, requestOptions)
    .then((response) => {
        if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
    })
    .then((result) => {
        let outputList = JSON.parse(result).data.messages
        // console.log(outputList)
        // console.log(outputList[outputList.length-1].searchAfter)
        let next = outputList[outputList.length-1]?.searchAfter
        if (!next)
        {
            outputLogsAsTxt();
            running = false;
        }
        else
        {
            searchReq(next);
            outputList.forEach(o => {output.push(o.ts + " " + o.text);})
            console.log(`${output.length} logs scraped`)
        }
    })
    .catch((error) => {
        console.error("Fetch error:", error);
    });
}


async function runScraperScript()
{
    if(!running)
    {
        userName = document.getElementById("name").value;
        console.log(`Scraping for ${userName}...`)
        running = true;
        try{
            searchReq();
        } catch (error)
        {
            console.log(error)
            console.log("Last logs before crash:")
            for(let i = 1; i < 11; i++)
            {
                console.log(output[output.length-i]);
            }
        
        }
        running = false;
    }
}