import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getHeaderNavTitle,
  getNavAuthLabel,
  shouldAutoHideNav,
  isNavVisible,
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

test('isNavVisible hides floating nav after idle timeout unless hovered', () => {
  // When idle and not hovered, nav hides even if expanded
  assert.equal(isNavVisible({ isIdle: true, isHovered: false, isExpanded: true }), false);
  
  // When hovered, always visible even if idle
  assert.equal(isNavVisible({ isIdle: true, isHovered: true, isExpanded: false }), true);
  assert.equal(isNavVisible({ isIdle: true, isHovered: true, isExpanded: true }), true);

  // When not idle, visible
  assert.equal(isNavVisible({ isIdle: false, isHovered: false, isExpanded: false }), true);
  assert.equal(isNavVisible({ isIdle: false, isHovered: false, isExpanded: true }), true);

  // When idle, not hovered, and collapsed: hidden
  assert.equal(isNavVisible({ isIdle: true, isHovered: false, isExpanded: false }), false);
});
