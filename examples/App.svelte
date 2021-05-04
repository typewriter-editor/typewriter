<script>
import { Router, link, Route } from 'svelte-routing';
import { globalHistory } from 'svelte-routing/src/history';
import Basic from './Basic.svelte';
import CustomRoot from './CustomRoot.svelte';
import Toolbar from './Toolbar.svelte';
import BubbleMenu from './BubbleMenu.svelte';
import InlineMenu from './InlineMenu.svelte';
import Virtualized from './Virtualized.svelte';
import Placeholder from './Placeholder.svelte';
import MediumImages from './MediumImages.svelte';

let url = globalHistory.location.pathname;
const fullWidthRoutes = new Set(['/medium-images']);

$: fullWidth = fullWidthRoutes.has(url);
globalHistory.listen(() => url = globalHistory.location.pathname);
</script>

<Router>
  <div class="app">

    <div class="app-header">
      <div class="app-name">Typewriter</div>
    </div>

    <div class="app-body">

      <div class="app-menu">
        <div class="menu-title">Examples</div>
        <a href="/" class="menu-item" class:current={url === '/'} use:link>Basic Editor</a>
        <a href="/custom-root" class="menu-item" class:current={url === '/custom-root'} use:link>Custom Root</a>
        <a href="/toolbar" class="menu-item" class:current={url === '/toolbar'} use:link>Toolbar</a>
        <a href="/bubble-menu" class="menu-item" class:current={url === '/bubble-menu'} use:link>Bubble Menu</a>
        <a href="/inline-menu" class="menu-item" class:current={url === '/inline-menu'} use:link>Inline Menu</a>
        <a href="/virtualized" class="menu-item" class:current={url === '/virtualized'} use:link>Virtualized Rendering</a>
        <a href="/placeholder" class="menu-item" class:current={url === '/placeholder'} use:link>Placeholders</a>
        <a href="/medium-images" class="menu-item" class:current={url === '/medium-images'} use:link>Medium-like Images</a>
      </div>

      <div class="app-content" class:full-width={fullWidth}>
        <Route path="/" component={Basic}/>
        <Route path="/custom-root" component={CustomRoot}/>
        <Route path="/toolbar" component={Toolbar}/>
        <Route path="/bubble-menu" component={BubbleMenu}/>
        <Route path="/inline-menu" component={InlineMenu}/>
        <Route path="/virtualized" component={Virtualized}/>
        <Route path="/placeholder" component={Placeholder}/>
        <Route path="/medium-images" component={MediumImages}/>
      </div>
    </div>

  </div>
</Router>

<style>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.app-header {
  flex: 0 0 48px;
  display: flex;
  align-items: center;
  background: #eee;
  border-bottom: 1px solid #ccc;
  padding: 0 16px;
}
.app-name {
  font-weight: bold;
  font-size: 24px;
}
.app-body {
  flex: 1;
  display: flex;
}
.app-menu {
  display: flex;
  flex-direction: column;
  width: 240px;
  border-right: 1px solid #ccc;
}
.menu-title {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 32px;
  font-weight: bold;
  color: #666;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 48px;
  color: rgb(0,100,200);
}
.menu-item.current {
  color: #fff;
  background-color: rgb(0,100,200);
}
.app-content {
  flex: 1;
  padding: 16px 32px;
  max-width: 760px;
}
.app-content.full-width {
  max-width: none;;
}
</style>
