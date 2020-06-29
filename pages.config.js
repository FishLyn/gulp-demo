module.exports = {
    data: {
        menus: [
            {
                name: 'Home',
                icon: 'aperture',
                link: 'index.html'
            },
            {
                name: 'About',
                link: 'about.html'
            },
            {
                name: 'Content',
                link: '#',
                children: [
                    {
                        name: 'Twitter',
                        link: 'https://twitter.com'
                    },
                    {
                        name: 'About',
                        link: 'https://weibo.com'
                    },
                    {
                        name: 'divider'
                    },
                    {
                        name: 'About',
                        link: 'https://github.com'
                    }
                ]
            }
        ],
        pkg: require('./package.json'),
        date: new Date()
    }
}