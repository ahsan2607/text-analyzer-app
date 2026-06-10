module.exports = async function (context, req) {
    const text = req.body?.text || "";
    
    // Analisis sederhana
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    const result = { words, characters, sentences };

    // (Opsional) Simpan log ke Table Storage dengan connection string dari App Settings
    if (process.env.AzureWebJobsStorage) {
        const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");
        const tableName = "TextAnalysisLogs";
        const storageAccount = process.env.STORAGE_ACCOUNT_NAME; // contoh env var
        const accountKey = process.env.STORAGE_ACCOUNT_KEY;
        if (storageAccount && accountKey) {
            const client = new TableClient(
                `https://${storageAccount}.table.core.windows.net`,
                tableName,
                new AzureNamedKeyCredential(storageAccount, accountKey)
            );
            await client.createEntity({
                partitionKey: "logs",
                rowKey: Date.now().toString(),
                text: text.substring(0, 500),
                result: JSON.stringify(result),
                timestamp: new Date().toISOString()
            });
        }
    }

    context.res = {
        status: 200,
        body: result,
        headers: { "Content-Type": "application/json" }
    };
};