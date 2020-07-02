// 实现这个项目的构建任务
const { src, dest, series, parallel, watch } = require('gulp')
const loadPlugins = require('gulp-load-plugins')
const browserSync = require('browser-sync')
const minimist = require('minimist')
const del = require('del')
const Comb = require('csscomb')
const standard = require('standard')

const plugins = loadPlugins()
const bs = browserSync.create()

const argv = minimist(process.argv.slice(2))

const data = {
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

// 清除文件命令
const clean = () => {
    return del(['temp', 'dist'])
}

// css 和 js 代码检查
const lint = done => {
    const comb = new Comb(require('./.csscomb.json'))
    comb.processPath('src')
    standard.lintFiles('./src/assets/scripts/*.js', { fix: true }, done)
}

// 代码编译
const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src' })
        .pipe(plugins.sass())
        .pipe(dest('temp'))
        .pipe(bs.reload({ stream: true }))
}
const script = () => {
    return src('src/assets/scripts/*.js', { base: 'src' })
        .pipe(plugins.babel({ presets: ['@babel/preset-env'] }))
        .pipe(dest('temp'))
        .pipe(bs.reload({ stream: true }))
}
const page = () => {
    return src('src/*.html', { base: 'src' })
        .pipe(plugins.swig({data, defaults: { cache: false }}))
        .pipe(dest('temp'))
        .pipe(bs.reload({ stream: true }))
}

// 图片和文字压缩
const image = () => {
    return src('src/assets/images/**', { base: 'src' })
        .pipe(plugins.imagemin())
        .pipe(dest('dist'))
}
const font = () => {
    return src('src/assets/fonts/**', { base: 'src' })
        .pipe(plugins.imagemin())
        .pipe(dest('dist'))
}

// 其他文件拷贝
const extra = () => {
    return src('public/**', { base: 'public' })
        .pipe(dest('dist'))
}

// 将html的引用文件合并压缩
const useref = () => {
    return src('temp/*.html', { base: 'temp' })
        .pipe(plugins.useref({ searchPath: ['temp', '.'] }))
        .pipe(plugins.if(/\.js$/, plugins.uglify()))
        .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
        .pipe(plugins.if(/\.html$/, plugins.htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true
        })))
        .pipe(dest('dist'))
}

// 打开服务器跑开发环境代码
const devServer = () => {

    watch('src/assets/styles/**', style)
    watch('src/assets/scripts/**', script)
    watch('src/*.html', page)

    watch([
        'src/assets/image/**',
        'src/assets/fonts/**',
        'public/**'
    ], bs.reload)

    bs.init({
        notify: false,
        port: 3002,
        server: {
            baseDir: ['temp', 'src', 'public'],
            routes: {
                '/node_modules': 'node_modules'
            }
        }
    })
}

// 打开服务器跑生产环境代码
const distServer = () => {
    bs.init({
        notify: false,
        port: 3003,
        server: 'dist'
    })
}

// 将编译后的静态项目部署到 github 的 gh-pages 分支预览
const upload = () => {
    return src('**', { cwd: 'dist' })
        .pipe(plugins.ghPages({
            cacheDir: 'temp/publish',
            branch: 'gh-pages'
        }))
}

// 更新本地仓库
const gitCommit = () => {
    const message = argv.message || 'update'

    return src('.')
    .pipe(plugins.git.add())
    .pipe(
        plugins.git.commit(undefined, {
            args: `-m "${message}"`,
            disableMessageRequirement: true
        })
    )
}

// 推送到远程仓库
const gitPush = done => {
    plugins.git.push('origin', 'master', (err) => {
        if (err) throw err
    })

    done()
}

// 编译组合任务
const compile = parallel(style, script, page)

// 打包生成线上项目
const build = series(clean, parallel(series(compile, useref), image, font, extra))

// 测试生产环境代码是否正常运行
const start = series(build, distServer)

// 打开服务器监听开发代码，实时编译
const serve = series(compile, devServer)

// 将编译后的静态项目部署到 github 的 gh-pages 分支下
const deploy = series(build, upload)

const gitUpdate = series(gitCommit, gitPush)

module.exports = {
    lint,
    serve,
    build,
    start,
    clean,
    deploy,
    gitUpdate
}