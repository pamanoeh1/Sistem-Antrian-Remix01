import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getHeaderNavTitle,
  getNavAuthLabel,
  shouldAutoHideNav,
  isNavVisible,
  TOP_REVEAL_ZONE_PX,
  isCursorInTopRevealZone,
  shouldWakeNavOnMouseMove,
} from './headerNavLogic';
import { UserSession } from './authLogic';

test('getHeaderNavTitle displays "Login" when not logged in for auth pages', () => {
  assert.equal(getHeaderNavTitle('login', null), 'Login');
  assert.equal(getHeaderNavTitle('penjaga', null), 'Login');
  assert.equal(getHeaderNavTitle('admin', null), 'Login');
  assert.equal(getHeaderNavTitle('display', null), 'Layar Display');
  assert.equal(getHeaderNavTitle('kiosk', null), 'Kios Tiket');
});

test('getHeaderNavTitle displays appropriate title when logged in', () => {
  const penjagaSession: UserSession = {
    role: 'penjaga',
    username: 'operator-1',
    name: 'Ahmad Fauzi',
    loginTime: new Date().toISOString(),
    counterId: 'loket-1',
    counterName: 'Loket 1',
  };

  const adminSession: UserSession = {
    role: 'server',
    username: 'admin',
    name: 'Admin Server',
    loginTime: new Date().toISOString(),
  };

  assert.equal(getHeaderNavTitle('penjaga', penjagaSession), 'Meja Penjaga');
  assert.equal(getHeaderNavTitle('admin', adminSession), 'Server Admin');
});

test('getNavAuthLabel returns "Login" when userSession is null', () => {
  const result = getNavAuthLabel(null);
  assert.equal(result.label, 'Login');
  assert.equal(result.targetPage, 'login');
  assert.equal(result.isLoggedIn, false);
});

test('getNavAuthLabel returns "Server Admin" when role is server', () => {
  const adminSession: UserSession = {
    role: 'server',
    username: 'admin',
    name: 'Admin Server',
    loginTime: new Date().toISOString(),
  };

  const result = getNavAuthLabel(adminSession);
  assert.equal(result.label, 'Server Admin');
  assert.equal(result.targetPage, 'admin');
  assert.equal(result.isLoggedIn, true);
  assert.equal(result.role, 'server');
});

test('getNavAuthLabel returns "Meja Penjaga" when role is penjaga', () => {
  const penjagaSession: UserSession = {
    role: 'penjaga',
    username: 'operator-2',
    name: 'Dewi Lestari',
    loginTime: new Date().toISOString(),
    counterId: 'loket-2',
    counterName: 'Loket 2',
  };

  const result = getNavAuthLabel(penjagaSession);
  assert.equal(result.label, 'Meja Penjaga');
  assert.equal(result.targetPage, 'penjaga');
  assert.equal(result.isLoggedIn, true);
  assert.equal(result.role, 'penjaga');
});

test('shouldAutoHideNav correctly identifies when idle time exceeds threshold', () => {
  assert.equal(shouldAutoHideNav(0), false);
  assert.equal(shouldAutoHideNav(4999), false);
  assert.equal(shouldAutoHideNav(5000), true);
  assert.equal(shouldAutoHideNav(6500), true);
});

test('isCursorInTopRevealZone and shouldWakeNavOnMouseMove reveal only near the top menu area', () => {
  assert.equal(isCursorInTopRevealZone(0), true);
  assert.equal(isCursorInTopRevealZone(TOP_REVEAL_ZONE_PX), true);
  assert.equal(isCursorInTopRevealZone(TOP_REVEAL_ZONE_PX + 1), false);
  assert.equal(isCursorInTopRevealZone(450), false);

  assert.equal(shouldWakeNavOnMouseMove(15, false), true);
  assert.equal(shouldWakeNavOnMouseMove(220, false), false);
  assert.equal(shouldWakeNavOnMouseMove(15, true), false); // Locked during fullscreen
});

test('isNavVisible hides floating nav after idle timeout unless hovered, and always hides in fullscreen', () => {
  assert.equal(isNavVisible({ isIdle: true, isHovered: false, isExpanded: true }), false);
  assert.equal(isNavVisible({ isIdle: true, isHovered: true, isExpanded: false }), true);
  assert.equal(isNavVisible({ isIdle: true, isHovered: true, isExpanded: true }), true);
  assert.equal(isNavVisible({ isIdle: false, isHovered: false, isExpanded: false }), true);
  assert.equal(isNavVisible({ isIdle: false, isHovered: false, isExpanded: true }), true);
  assert.equal(isNavVisible({ isIdle: true, isHovered: false, isExpanded: false }), false);
  assert.equal(isNavVisible({ isIdle: false, isHovered: true, isFullscreenLocked: true }), false);
});
