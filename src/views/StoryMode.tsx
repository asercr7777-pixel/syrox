import { CheckCircle2, Lock, Zap, Coins, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { STORY_CHAPTERS } from '../data/story';
import { getRankByXp } from '../data/ranks';
import { toast } from '../components/ui/Toast';

export default function StoryMode() {
  const { state, toggleStoryObjective, advanceStory } = useStore();
  const { storyChapterIndex, storyObjectivesCompleted, xp } = state;

  const currentChapter = STORY_CHAPTERS[storyChapterIndex];
  const objectiveKeys = currentChapter.objectives.map((_, i) => `${storyChapterIndex}-${i}`);
  const completedCount = objectiveKeys.filter((key) => storyObjectivesCompleted[key]).length;
  const allObjectivesCompleted = completedCount === currentChapter.objectives.length;

  const handleObjectiveToggle = (index: number) => {
    toggleStoryObjective(storyChapterIndex, index);
  };

  const handleContinueStory = () => {
    if (allObjectivesCompleted) {
      advanceStory();
      toast({ title: `Chapter completed! ${currentChapter.rewardText}`, type: 'success' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Story Mode</h1>
        <p className="text-sm text-ink-300">Your journey to becoming a god-tier hunter</p>
      </div>

      {/* Current Chapter Hero Card */}
      <div className="card p-6 md:p-8 border border-purple-500/30">
          {/* Chapter Number Display */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {String(currentChapter.chapter).padStart(2, '0')}
              </div>
              <div className="text-6xl">{currentChapter.emoji}</div>
            </div>
          </div>

          {/* Chapter Title */}
          <h2 className="font-display text-4xl font-bold mb-4 text-white">
            {currentChapter.title}
          </h2>

          <p className="text-ink-300 text-base italic mb-6 leading-relaxed max-w-2xl">
            {currentChapter.description}
          </p>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-4">Objectives</h3>
            <div className="space-y-3">
              {currentChapter.objectives.map((objective, index) => {
                const key = `${storyChapterIndex}-${index}`;
                const isCompleted = storyObjectivesCompleted[key];
                return (
                  <label key={index} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleObjectiveToggle(index)}
                      className="w-5 h-5 rounded border-2 border-purple-400/50 bg-ink-900 checked:bg-purple-500 checked:border-purple-500 cursor-pointer transition-all"
                    />
                    <span className={`transition-all ${isCompleted ? 'text-ink-500 line-through' : 'text-ink-200 group-hover:text-white'}`}>
                      {objective}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Progress</span>
              <span className="text-sm text-ink-300">{completedCount} / {currentChapter.objectives.length}</span>
            </div>
            <div className="w-full h-2 bg-ink-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${(completedCount / currentChapter.objectives.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 rounded-lg p-4 border border-purple-400/20 bg-purple-500/5">
              <div className="flex items-center gap-2 text-purple-300 mb-1">
                <Zap size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">XP Reward</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">+{currentChapter.rewardXp}</div>
            </div>
            <div className="flex-1 rounded-lg p-4 border border-amber-400/20 bg-amber-500/5">
              <div className="flex items-center gap-2 text-amber-300 mb-1">
                <Coins size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Coins</span>
              </div>
              <div className="text-2xl font-bold text-amber-400">+{currentChapter.rewardCoins}</div>
            </div>
          </div>

          {/* Continue Story Button */}
          <button
            onClick={handleContinueStory}
            disabled={!allObjectivesCompleted}
            className={`btn-primary w-full py-3 font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
              allObjectivesCompleted
                ? 'opacity-100 cursor-pointer hover:scale-105'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            Continue Story
            <ChevronRight size={20} />
          </button>
      </div>

      {/* Chapter Progression Timeline */}
      <div>
        <h2 className="section-title mb-4">Story Progression</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {STORY_CHAPTERS.map((chapter, index) => {
            const isCompleted = index < storyChapterIndex;
            const isCurrent = index === storyChapterIndex;
            const isLocked = xp < chapter.requiredXp;
            const requiredRank = getRankByXp(chapter.requiredXp);

            return (
              <div
                key={chapter.id}
                className={`card p-4 transition-all ${
                  isCurrent
                    ? 'border-2 border-purple-400 ring-2 ring-purple-400/50'
                    : isCompleted
                    ? 'border border-emerald-400/40'
                    : isLocked
                    ? 'opacity-40 blur-[2px]'
                    : ''
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{chapter.emoji}</div>
                  <div className="font-display font-bold text-sm text-purple-300 mb-1">
                    Ch. {chapter.chapter}
                  </div>
                  <p className="text-xs text-ink-400 line-clamp-2 mb-3">{chapter.title}</p>

                  {isCompleted && (
                    <div className="flex justify-center">
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    </div>
                  )}

                  {isCurrent && (
                    <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Current</div>
                  )}

                  {isLocked && (
                    <div className="space-y-1">
                      <Lock size={16} className="mx-auto text-ink-500 mb-1" />
                      <div className="text-xs text-ink-500">Rank: {requiredRank?.name}</div>
                      <div className="text-xs text-ink-600">{chapter.requiredXp} XP</div>
                    </div>
                  )}

                  {!isCompleted && !isLocked && !isCurrent && (
                    <div className="text-xs text-ink-500">Available</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-ink-400 uppercase tracking-wider mb-1">Total XP</p>
          <p className="text-2xl font-bold text-purple-400">{xp.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-400 uppercase tracking-wider mb-1">Current Chapter</p>
          <p className="text-2xl font-bold text-pink-400">{currentChapter.chapter}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-400 uppercase tracking-wider mb-1">Chapters Cleared</p>
          <p className="text-2xl font-bold text-emerald-400">{storyChapterIndex}</p>
        </div>
      </div>
    </div>
  );
}
