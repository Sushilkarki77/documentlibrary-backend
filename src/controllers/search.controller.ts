import { RequestHandler } from "express";
import { ResponseItem, ErrorWithStatus, SearchResult } from "../types/interfaces";
import { runSearch } from "../services/search.service";


export const searchQueryHandler: RequestHandler<unknown, ResponseItem<SearchResult>, unknown, { query: string, skip: number, limit: number }> = async (req, res, next) => {
    try {
        const { query, skip, limit } = req.query;
    
        if (!query) throw new ErrorWithStatus("Search query is required!", 400);
        const searchres = await runSearch(query, req.user._id, skip, limit);
        const totalCount = searchres.resultItems.length > 0 ? searchres.resultItems[0].totalCount : 0

        res.status(200).json({ status: true, message: "success", data: { ...searchres, totalCount: totalCount } })
    } catch (error) {
        next(error);
    }

}
