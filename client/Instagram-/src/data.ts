export const currentUser = {
  username: 'shrushtiganacharya',
  fullName: 'S H R U S H T I',
  avatar: 'https://i.pravatar.cc/150?u=shrushti'
};

export const posts = [
  {
    id: 1,
    user: {
      username: 'kevin',
      avatar: 'https://i.pravatar.cc/150?u=kevin',
    },
    time: '12h',
    contentImg: 'https://images.unsplash.com/photo-1551316679-9c6ae9dec224?auto=format&fit=crop&q=80&w=800&h=800',
    likes: '142',
    caption: 'Just launched! Here is to the first photo. #instagram',
    comments: [
      { username: 'mike99', text: 'This looks amazing!', isHandwritten: true },
      { username: 'sarah', text: 'Love the vintage vibes.' }
    ]
  },
  {
    id: 2,
    user: {
      username: 'doglover',
      avatar: 'https://i.pravatar.cc/150?u=dog',
    },
    time: '1d',
    contentImg: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800&h=800',
    likes: '89',
    caption: 'Man\'s best friend enjoying the sunset. #puppy',
    comments: [
      { username: 'vintage_cars', text: 'So cute!!!', isHandwritten: true }
    ]
  },
  {
    id: 3,
    user: {
      username: 'instantbollywood',
      avatar: 'https://i.pravatar.cc/150?u=instantbollywood',
    },
    time: '2d',
    contentImg: 'https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&q=80&w=800&h=800',
    likes: '34k',
    caption: 'Classic moments captured perfectly.',
    comments: []
  },
  {
    id: 4,
    user: {
      username: 'vintage_cars',
      avatar: 'https://i.pravatar.cc/150?u=vintage_cars',
    },
    time: '3d',
    contentImg: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800&h=800',
    likes: '456',
    caption: 'A beauty on the road. #classic'
  },
  {
    id: 5,
    user: {
      username: 'photofan',
      avatar: 'https://i.pravatar.cc/150?u=photofan',
    },
    time: '5d',
    contentImg: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=800&h=800',
    likes: '210',
    caption: 'Nothing like film photography. 📸'
  }
];
