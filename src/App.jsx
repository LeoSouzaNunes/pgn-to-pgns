import { useState, useMemo, useCallback } from "react";

function App() {
    const [games, setGames] = useState([]);
    const [filter, setFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    const parseDateString = useCallback((dateStr) => {
        const normalizedDate = dateStr.replace(/\./g, "-");
        return new Date(normalizedDate);
    }, []);

    const extractResult = useCallback((gameContent) => {
        const resultMatch = gameContent.match(/\[Result "([^"]+)"/);
        return resultMatch ? resultMatch[1] : null;
    }, []);

    const handleFileUpload = useCallback(
        (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const gameRegex = /\[Event[\s\S]*?(?=\n\n\[Event|$)/g;
                const gamesList = text.match(gameRegex) || [];

                const validGames = gamesList.filter((game) => {
                    return (
                        game.includes("[Event") &&
                        game.includes("[Result") &&
                        (game.includes("1-0") ||
                            game.includes("0-1") ||
                            game.includes("1/2-1/2"))
                    );
                });

                const processedGames = validGames.map((game) => {
                    const dateMatch = game.match(/\[SourceDate "([^"]+)"/);
                    const date = dateMatch ? dateMatch[1] : "1900.01.01";
                    const result = extractResult(game);
                    return {
                        content: game.trim(),
                        date: date,
                        dateObj: parseDateString(date),
                        result: result,
                    };
                });

                const sortedGames = processedGames.sort(
                    (a, b) => b.dateObj - a.dateObj
                );
                setGames(sortedGames);
                setCurrentPage(1); // Reset to first page when new files are uploaded
            };

            reader.readAsText(file);
        },
        [extractResult, parseDateString]
    );

    const downloadGame = useCallback((gameContent, index) => {
        const blob = new Blob([gameContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `game_${index + 1}.pgn`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    const filteredGames = useMemo(() => {
        switch (filter) {
            case "wins":
                return games.filter((game) => game.result === "1-0");
            case "losses":
                return games.filter((game) => game.result === "0-1");
            case "draws":
                return games.filter((game) => game.result === "1/2-1/2");
            default:
                return games;
        }
    }, [games, filter]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredGames.length / ITEMS_PER_PAGE);
    const paginatedGames = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredGames.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredGames, currentPage]);

    const downloadAllGames = useCallback(() => {
        filteredGames.forEach((game, index) => {
            setTimeout(() => {
                downloadGame(game.content, index);
            }, index * 100);
        });
    }, [filteredGames, downloadGame]);

    const downloadCurrentPage = useCallback(() => {
        paginatedGames.forEach((game, index) => {
            setTimeout(() => {
                downloadGame(game.content, index);
            }, index * 100);
        });
    }, [paginatedGames, downloadGame]);

    const setFilterAll = useCallback(() => setFilter("all"), []);
    const setFilterWins = useCallback(() => setFilter("wins"), []);
    const setFilterLosses = useCallback(() => setFilter("losses"), []);
    const setFilterDraws = useCallback(() => setFilter("draws"), []);

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">PGNtoPGNs</h1>
                <p className="text-gray-300 mb-4">
                    Split your chess games collection into individual PGN files
                    for easier management
                </p>
                <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 font-medium">
                    Import PGN File
                    <input
                        type="file"
                        accept=".pgn"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </label>
            </div>

            {games.length > 0 && (
                <div className="mt-8">
                    <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:justify-between sm:items-center">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <h2 className="text-2xl font-semibold">
                                {filteredGames.length} games parsed
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={setFilterAll}
                                    className={`px-4 py-2 rounded font-medium transition-colors cursor-pointer ${
                                        filter === "all"
                                            ? "bg-blue-600 text-white hover:bg-blue-700"
                                            : "bg-gray-700 text-white hover:bg-gray-600"
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={setFilterWins}
                                    className={`px-4 py-2 rounded font-medium transition-colors cursor-pointer ${
                                        filter === "wins"
                                            ? "bg-green-600 text-white hover:bg-green-700"
                                            : "bg-gray-700 text-white hover:bg-gray-600"
                                    }`}
                                >
                                    Wins
                                </button>
                                <button
                                    onClick={setFilterLosses}
                                    className={`px-4 py-2 rounded font-medium transition-colors cursor-pointer ${
                                        filter === "losses"
                                            ? "bg-red-600 text-white hover:bg-red-700"
                                            : "bg-gray-700 text-white hover:bg-gray-600"
                                    }`}
                                >
                                    Losses
                                </button>
                                <button
                                    onClick={setFilterDraws}
                                    className={`px-4 py-2 rounded font-medium transition-colors cursor-pointer ${
                                        filter === "draws"
                                            ? "bg-yellow-600 text-white hover:bg-yellow-700"
                                            : "bg-gray-700 text-white hover:bg-gray-600"
                                    }`}
                                >
                                    Draws
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={downloadCurrentPage}
                                className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
                            >
                                Download Page
                            </button>
                            <button
                                onClick={downloadAllGames}
                                className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium"
                            >
                                Download All
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {paginatedGames.map((game, index) => (
                            <div
                                key={index}
                                className="flex justify-between items-center p-4 rounded border border-gray-600 bg-gray-800 hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex-1">
                                    <p className="font-mono text-sm text-gray-100">
                                        <span className="font-bold">
                                            Game{" "}
                                            {(currentPage - 1) *
                                                ITEMS_PER_PAGE +
                                                index +
                                                1}
                                        </span>{" "}
                                        -
                                        <span className="ml-2">
                                            Date: {game.date}
                                        </span>{" "}
                                        -
                                        <span className="ml-2">
                                            Result: {game.result}
                                        </span>
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        downloadGame(
                                            game.content,
                                            (currentPage - 1) * ITEMS_PER_PAGE +
                                                index
                                        )
                                    }
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-4 font-medium"
                                >
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-6 gap-2">
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1)
                                    )
                                }
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded font-medium ${
                                    currentPage === 1
                                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                            >
                                Previous
                            </button>
                            <span className="text-gray-300">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(prev + 1, totalPages)
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className={`px-4 py-2 rounded font-medium ${
                                    currentPage === totalPages
                                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            <footer className="mt-12">
                <div className="text-center">
                    <p className="text-gray-300 mb-3">Made by LeoSouzaNunes</p>
                    <div className="flex justify-center gap-4">
                        <a
                            href="https://github.com/LeoSouzaNunes"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Github
                        </a>
                        <span className="text-gray-500">|</span>
                        <a
                            href="https://www.linkedin.com/in/leonardodesnunes"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Linkedin
                        </a>
                        <span className="text-gray-500">|</span>
                        <a
                            href="https://streamlabs.com/leonardosnn/tip"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Tip
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
