<script lang="ts">
  import { page } from '$app/stores';

  $: path = $page.url.pathname;
  const fullScreenRoutes = new Set(['/medium-images']);

  $: fullScreen = fullScreenRoutes.has(path);
</script>

<div class="app">
  <div class="app-header">
    <div class="app-name"><a href="/">Typewriter</a></div>
  </div>

  <div class="app-body">
    {#if !fullScreen}
      <div class="app-menu">
        <div class="menu-title">Examples</div>
        <a href="/" class="menu-item" class:current={path === '/'}>Basic Editor</a>
        <a href="/custom-root" class="menu-item" class:current={path === '/custom-root'}>Custom Root</a>
        <a href="/toolbar" class="menu-item" class:current={path === '/toolbar'}>Toolbar</a>
        <a href="/bubble-menu" class="menu-item" class:current={path === '/bubble-menu'}>Bubble Menu</a>
        <a href="/inline-menu" class="menu-item" class:current={path === '/inline-menu'}>Inline Menu</a>
        <a href="/virtualized" class="menu-item" class:current={path === '/virtualized'}>Virtualized Rendering</a>
        <a href="/smart-entry" class="menu-item" class:current={path === '/smart-entry'}>Smart Text</a>
        <a href="/placeholder" class="menu-item" class:current={path === '/placeholder'}>Placeholders</a>
        <a href="/table" class="menu-item" class:current={path === '/table'}>Table</a>
        <a href="/description-list" class="menu-item" class:current={path === '/description-list'}>Description List</a>
        <a href="/medium-images" class="menu-item" class:current={path === '/medium-images'}>Medium-like Images</a>
      </div>
    {/if}

    <div class="app-content" class:full-width={fullScreen}>
      <slot></slot>
      <!-- <Route path="/" component={Basic}/>
          <Route path="/custom-root" component={CustomRoot}/>
          <Route path="/toolbar" component={Toolbar}/>
          <Route path="/bubble-menu" component={BubbleMenu}/>
          <Route path="/inline-menu" component={InlineMenu}/>
          <Route path="/virtualized" component={Virtualized}/>
          <Route path="/smart-entry" component={SmartEntry}/>
          <Route path="/placeholder" component={Placeholder}/>
          <Route path="/table" component={Table}/>
          <Route path="/description-list" component={DescriptionList}/>
          <Route path="/medium-images" component={MediumImages}/> -->
    </div>
  </div>
</div>

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
  .app-name a {
    text-decoration: none;
    color: inherit;
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
    color: rgb(0, 100, 200);
  }
  .menu-item.current {
    color: #fff;
    background-color: rgb(0, 100, 200);
  }
  .app-content {
    flex: 1;
    padding: 16px 32px;
    max-width: 760px;
  }
  .app-content.full-width {
    display: flex;
    flex-direction: column;
    max-width: none;
  }
</style>
