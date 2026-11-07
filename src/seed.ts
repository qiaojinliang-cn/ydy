import type { Item, WorkspaceState } from './types';
const date = '2026-11-07T09:00:00+08:00';
const asset = (name: string) => `/assets/eden/${name}.jpg`;
const make = (id: string, kind: Item['kind'], title: string, content: string, extra: Partial<Item> = {}): Item => ({ id, kind, title, content, tags: [], createdAt: date, ...extra });
export const initialState: WorkspaceState = {
  version: 1,
  settings: { workspace: 'YG’s workspace', name: 'YG', theme: 'light', language: 'English' },
  boards: [
    { id: 'swipe-file', title: 'Swipe file', description: 'Good ideas are everywhere. Keep the ones that stay with you.', color: '#aabda5', icon: 'telescope' },
    { id: 'content-ideas', title: 'Content ideas', description: 'A place for the things you can’t stop thinking about.', color: '#d8bd88', icon: 'bulb' },
    { id: 'personal-brand', title: 'Personal brand', description: 'Your point of view. Your work. Your corner of the internet.', color: '#b6b9ce', icon: 'fingerprint' }
  ],
  items: [
    make('video-hormozi', 'video', 'The best advice I ever got about building a business', 'Make something people actually want. Then make it easier to say yes.', { image: asset('hormozi-thumb'), avatar: asset('hormozi-avatar'), author: 'Alex Hormozi', platform: 'YouTube', tags: ['Business', 'Personal Development'], boardId: 'swipe-file', views: '1.2M', outlier: '8.7×', duration: '12:48', note: 'A simple idea, told with an unforgettable story.' }),
    make('note-thinking', 'document', 'Make room for better ideas', 'The best ideas don’t arrive when you’re trying harder. They arrive when you give yourself space to notice.\n\nA walk without headphones. A book with a pencil. A conversation without an agenda.\n\nCollect what makes you pause. Write down why. The connection comes later.', { tags: ['Creativity', 'Writing'], boardId: 'content-ideas', color: '#e8e2ce', starred: true }),
    make('video-bloom', 'video', 'A little perspective changes everything.', 'What would you do differently if you had a little more perspective?', { image: asset('bloom-thumb'), avatar: asset('bloom-avatar'), author: 'Sahil Bloom', platform: 'Instagram', tags: ['Personal Development', 'Creativity'], views: '685K', outlier: '12.4×', boardId: 'swipe-file' }),
    make('card-less', 'card', 'Build a life you don’t need to escape from.', 'Build a life you don’t need to escape from.\n\nMore intention. Less noise.\nBetter questions. Fewer tabs.', { tags: ['Philosophy', 'Personal Development'], author: 'A thought to come back to', color: '#e9eee3', boardId: 'content-ideas' }),
    make('video-dango', 'video', 'Small habits. An entirely different life.', 'The things you do every day matter more than the things you do once in a while.', { image: asset('dango-thumb'), avatar: asset('dango-avatar'), author: 'Dan Go', platform: 'Instagram', views: '892K', outlier: '6.2×', tags: ['Health', 'Personal Development'], boardId: 'swipe-file', duration: '0:58' }),
    make('card-original', 'card', 'Your perspective is the product.', 'You don’t need a completely new idea.\n\nYou need an honest perspective on an idea that matters.\n\nThat’s the part nobody else can copy.', { author: 'Writing notes', tags: ['Writing', 'Content Strategy'], boardId: 'personal-brand', color: '#f1e9dd', starred: true }),
    make('video-sung', 'video', 'The notebook system that saved my brain', 'A simple system to think clearly, capture ideas, and make things happen.', { image: asset('sung-thumb'), avatar: asset('sung-avatar'), author: 'Sung', platform: 'YouTube', duration: '14:26', views: '214K', outlier: '4.8×', tags: ['Creativity', 'Writing'], boardId: 'swipe-file' }),
    make('link-notebook', 'link', 'A small place for big thoughts', 'The notebook is not a productivity tool. It is a place to pay attention.', { image: asset('notebook-thumb'), author: 'Notes on creativity', platform: 'Article', url: 'https://eden.so/features/boards/', tags: ['Creativity', 'Writing'], boardId: 'content-ideas' }),
    make('video-leila', 'video', 'You can do hard things.', 'The confidence you are looking for comes after you begin, not before.', { image: asset('leila-thumb'), avatar: asset('leila-avatar'), author: 'Leila Hormozi', platform: 'Instagram', views: '1.1M', outlier: '9.3×', tags: ['Business', 'Personal Development'] }),
    make('note-signature', 'document', 'My intellectual signature', 'Who I’m for\nCurious people building a more intentional creative life.\n\nWhat I believe\nClarity comes from making things, not from waiting to feel ready.\n\nWhat I’m against\nMore noise. More urgency. Work without meaning.\n\nWhat I’m building\nA small body of work that helps someone see something differently.', { tags: ['Content Strategy', 'Philosophy'], boardId: 'personal-brand' }),
    make('video-filips', 'video', 'What if being yourself is the whole point?', 'You are the niche. Your interests are the thread that connects your work.', { image: asset('filips-thumb'), avatar: asset('filips-avatar'), author: 'Dan Koe', platform: 'YouTube', duration: '18:32', views: '472K', outlier: '7.6×', tags: ['Philosophy', 'Content Strategy'], boardId: 'personal-brand' }),
    make('card-attention', 'card', 'Attention is a creative practice.', 'Read slowly.\nNotice what you notice.\nSave the line that stays with you.\nMake something from it.', { tags: ['Creativity', 'Philosophy'], color: '#e5e6ee', boardId: 'content-ideas' })
  ],
  plans: [
    { id: 'plan-1', title: 'Your perspective is the product', stage: 'Idea', pillar: 'Creativity', platform: 'X', date: '', notes: 'Start with a belief that changed how you work.' },
    { id: 'plan-2', title: 'The quiet power of doing less', stage: 'Draft', pillar: 'Personal Development', platform: 'LinkedIn', date: '2026-11-09', notes: 'One observation, one story, one useful next step.' },
    { id: 'plan-3', title: 'A notebook, a walk, and a better question', stage: 'Idea', pillar: 'Writing', platform: 'YouTube', date: '', notes: '' }
  ],
  drafts: [], messages: [],
  customAIs: [
    { id: 'ai-1', name: 'The 30-Day Creator Sprint', description: 'Find your point of view. Build a body of work. One day at a time.', icon: 'compass', instructions: 'Coach the creator through one small, concrete action. Ground suggestions in their own ideas. Do not invent results.' },
    { id: 'ai-2', name: 'Your writing partner', description: 'A second pair of eyes. Not a replacement for your voice.', icon: 'feather', instructions: 'Help the writer find clarity. Keep their voice and point of view. Explain edits briefly.' }
  ]
};
