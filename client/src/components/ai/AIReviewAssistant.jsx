import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, Shield, Hash, Loader2, ChevronDown } from 'lucide-react';
import aiService from '../../services/aiService';
import toast from 'react-hot-toast';

const getReviewLength = (text) => (text?.trim().length ?? 0);

export default function AIReviewAssistant({
    movieTitle,
    rating,
    genres = [],
    currentReview = '',
    onUpdateReview,
    onAddTags
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeAction, setActiveAction] = useState(null);

    const handleGenerate = async () => {
        if (!rating || rating <= 0) {
            toast.error('Please rate the show first');
            return;
        }

        setIsLoading(true);
        setActiveAction('generate');

        try {
            const draft = await aiService.generateReviewDraft(movieTitle, rating, genres);
            onUpdateReview(draft);
            toast.success('Review draft generated!');
            setIsOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setIsLoading(false);
            setActiveAction(null);
        }
    };

    const handleExpand = async () => {
        if (getReviewLength(currentReview) < 10) {
            toast.error('Please write at least a few thoughts first');
            return;
        }

        setIsLoading(true);
        setActiveAction('expand');

        try {
            const expanded = await aiService.expandThoughts(currentReview);
            onUpdateReview(expanded);
            toast.success('Review expanded!');
            setIsOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setIsLoading(false);
            setActiveAction(null);
        }
    };

    const handleSpoilerFree = async () => {
        if (getReviewLength(currentReview) === 0) {
            toast.error('Please add some review text first');
            return;
        }

        setIsLoading(true);
        setActiveAction('spoiler');

        try {
            const clean = await aiService.removeSpoilers(currentReview);
            onUpdateReview(clean);
            toast.success('Spoilers removed!');
            setIsOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setIsLoading(false);
            setActiveAction(null);
        }
    };

    const handleSuggestTags = async () => {
        if (getReviewLength(currentReview) < 10) {
            toast.error('Please write at least a few thoughts first');
            return;
        }

        setIsLoading(true);
        setActiveAction('tags');

        try {
            const { tags } = await aiService.suggestTags(currentReview);
            if (tags && tags.length > 0) {
                onAddTags(tags);
                toast.success(`Added ${tags.length} tags`);
            } else {
                toast('No relevant tags found');
            }
            setIsOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setIsLoading(false);
            setActiveAction(null);
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Sparkles className="w-4 h-4" />
                )}
                AI Assistant
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-50 left-0 mt-2 w-64 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700"
                    >
                        <div className="space-y-1">
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Wand2 className="w-4 h-4 text-purple-500" />
                                <div>
                                    <div className="font-medium text-gray-700 dark:text-gray-200">Generate Draft</div>
                                    <div className="text-xs text-gray-400">From your rating</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={handleExpand}
                                disabled={isLoading}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <div>
                                    <div className="font-medium text-gray-700 dark:text-gray-200">Expand Thoughts</div>
                                    <div className="text-xs text-gray-400">Turn bullets into review</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={handleSpoilerFree}
                                disabled={isLoading}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Shield className="w-4 h-4 text-green-500" />
                                <div>
                                    <div className="font-medium text-gray-700 dark:text-gray-200">Remove Spoilers</div>
                                    <div className="text-xs text-gray-400">Make it safe to read</div>
                                </div>
                            </button>

                            <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

                            <button
                                type="button"
                                onClick={handleSuggestTags}
                                disabled={isLoading}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Hash className="w-4 h-4 text-blue-500" />
                                <div>
                                    <div className="font-medium text-gray-700 dark:text-gray-200">Suggest Tags</div>
                                    <div className="text-xs text-gray-400">Based on your review</div>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
