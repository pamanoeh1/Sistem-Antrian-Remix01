<?php
/**
 * InfinityFree & Apache/PHP Synchronization Backend for Antrean App
 * File ini memungkinkan sinkronisasi real-time antar perangkat (Display TV, Kios, Loket HP, Laptop)
 * tanpa memerlukan server Node.js!
 */

// Set header CORS & JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Tangani Preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Lokasi penyimpanan data JSON di folder yang sama
$dataFile = __DIR__ . '/queue_sync_data.json';
$tempFallback = sys_get_temp_dir() . '/infinityfree_queue_sync_data.json';

// Fungsi bantu baca data JSON dengan file lock
function readData($filePath, $fallbackPath) {
    $targetFile = file_exists($filePath) || is_writable(__DIR__) ? $filePath : $fallbackPath;
    if (!file_exists($targetFile)) {
        return [
            'version' => 1,
            'lastEventId' => 0,
            'events' => [],
            'state' => [
                'activeTicket' => null,
                'counters' => [],
                'queues' => [],
                'audioSettings' => null,
                'mediaSettings' => null,
                'company' => null,
                'services' => null,
                'penjagaAccounts' => null,
                'adminCredentials' => null,
                'lanSettings' => null,
            ],
            'updatedAt' => round(microtime(true) * 1000)
        ];
    }
    
    $fp = @fopen($targetFile, 'r');
    if (!$fp) return null;
    flock($fp, LOCK_SH);
    $content = @stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    
    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : null;
}

// Fungsi bantu simpan data JSON dengan atomic write
function writeData($filePath, $fallbackPath, $data) {
    $targetFile = is_writable(__DIR__) || file_exists($filePath) ? $filePath : $fallbackPath;
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
    $fp = @fopen($targetFile, 'c+');
    if (!$fp) {
        $targetFile = $fallbackPath;
        $fp = @fopen($targetFile, 'c+');
    }
    
    if (!$fp) return false;
    
    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, $json);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        return true;
    }
    
    fclose($fp);
    return false;
}

$nowMs = round(microtime(true) * 1000);
$currentData = readData($dataFile, $tempFallback);
if (!$currentData) {
    $currentData = [
        'version' => 1,
        'lastEventId' => 0,
        'events' => [],
        'state' => [
            'activeTicket' => null,
            'counters' => [],
            'queues' => [],
            'audioSettings' => null,
            'mediaSettings' => null,
            'company' => null,
            'services' => null,
            'penjagaAccounts' => null,
            'adminCredentials' => null,
            'lanSettings' => null,
        ],
        'updatedAt' => $nowMs
    ];
}

// -------------------------------------------------------------
// METODE 1: POST (Kirim event panggil antrean / update status)
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Input data JSON tidak valid']);
        exit;
    }

    $action = isset($_GET['action']) ? $_GET['action'] : (isset($input['action']) ? $input['action'] : 'post_event');

    if ($action === 'reset_queue') {
        $currentData['state']['activeTicket'] = null;
        $currentData['state']['queues'] = [];
        $currentData['events'] = [];
        $currentData['lastEventId']++;
        $resetEvent = [
            'id' => $currentData['lastEventId'],
            'type' => 'STATE_RESET',
            'timestamp' => $nowMs,
            'senderId' => isset($input['senderId']) ? $input['senderId'] : 'php_server'
        ];
        $currentData['events'][] = $resetEvent;
        $currentData['updatedAt'] = $nowMs;
        writeData($dataFile, $tempFallback, $currentData);

        echo json_encode(['status' => 'ok', 'action' => 'reset', 'event' => $resetEvent]);
        exit;
    }

    // Tangani event antrean (TICKET_CALLED, COUNTER_UPDATED, SETTINGS_SYNC, dll)
    $event = isset($input['event']) && is_array($input['event']) ? $input['event'] : $input;
    if (isset($event['type'])) {
        $currentData['lastEventId']++;
        $eventRecord = $event;
        $eventRecord['id'] = $currentData['lastEventId'];
        if (!isset($eventRecord['timestamp'])) {
            $eventRecord['timestamp'] = $nowMs;
        }

        // Simpan snapshot state bila disertakan
        if (isset($event['ticket'])) {
            $currentData['state']['activeTicket'] = $event['ticket'];
        }
        if (isset($event['counters']) && is_array($event['counters'])) {
            $currentData['state']['counters'] = $event['counters'];
        }
        if (isset($event['queues']) && is_array($event['queues'])) {
            $currentData['state']['queues'] = $event['queues'];
        }
        if (isset($event['audioSettings'])) {
            $currentData['state']['audioSettings'] = $event['audioSettings'];
        }
        if (isset($event['mediaSettings'])) {
            $currentData['state']['mediaSettings'] = $event['mediaSettings'];
        }
        if (isset($event['company'])) {
            $currentData['state']['company'] = $event['company'];
        }
        if (isset($event['services']) && is_array($event['services'])) {
            $currentData['state']['services'] = $event['services'];
        }
        if (isset($event['penjagaAccounts']) && is_array($event['penjagaAccounts'])) {
            $currentData['state']['penjagaAccounts'] = $event['penjagaAccounts'];
        }
        if (isset($event['adminCredentials'])) {
            $currentData['state']['adminCredentials'] = $event['adminCredentials'];
        }
        if (isset($event['lanSettings'])) {
            $currentData['state']['lanSettings'] = $event['lanSettings'];
        }

        // Masukkan ke log events (batasi 50 event terakhir agar hemat memori)
        $currentData['events'][] = $eventRecord;
        if (count($currentData['events']) > 50) {
            $currentData['events'] = array_slice($currentData['events'], -50);
        }

        $currentData['updatedAt'] = $nowMs;
        writeData($dataFile, $tempFallback, $currentData);

        echo json_encode([
            'status' => 'ok',
            'syncEngine' => 'php_infinityfree',
            'eventId' => $currentData['lastEventId'],
            'serverTime' => $nowMs,
            'event' => $eventRecord
        ]);
        exit;
    }

    // Jika hanya upload snapshot state
    if (isset($input['state']) && is_array($input['state'])) {
        $currentData['state'] = array_merge($currentData['state'], $input['state']);
        $currentData['updatedAt'] = $nowMs;
        writeData($dataFile, $tempFallback, $currentData);
        echo json_encode(['status' => 'ok', 'syncEngine' => 'php_infinityfree', 'serverTime' => $nowMs]);
        exit;
    }

    echo json_encode(['status' => 'ignored', 'message' => 'Format tidak dikenali']);
    exit;
}

// -------------------------------------------------------------
// METODE 2: GET (Polling event baru dan sinkronisasi data antrean)
// -------------------------------------------------------------
$since = isset($_GET['since']) ? (float)$_GET['since'] : 0;
$lastId = isset($_GET['last_id']) ? (int)$_GET['last_id'] : 0;
$getState = isset($_GET['get_state']) ? (bool)$_GET['get_state'] : ($since == 0);

// Filter event yang lebih baru dari $since atau $lastId
$newEvents = [];
if (isset($currentData['events']) && is_array($currentData['events'])) {
    foreach ($currentData['events'] as $ev) {
        $evId = isset($ev['id']) ? (int)$ev['id'] : 0;
        $evTime = isset($ev['timestamp']) ? (float)$ev['timestamp'] : 0;
        
        if ($lastId > 0) {
            if ($evId > $lastId) {
                $newEvents[] = $ev;
            }
        } elseif ($since > 0) {
            if ($evTime > $since) {
                $newEvents[] = $ev;
            }
        } else {
            // First connect: get latest 10 events
            $newEvents[] = $ev;
        }
    }
}

// Format respon JSON
$response = [
    'status' => 'ok',
    'syncEngine' => 'php_infinityfree',
    'serverTime' => $nowMs,
    'lastEventId' => $currentData['lastEventId'],
    'events' => $newEvents,
];

if ($getState) {
    $response['state'] = $currentData['state'];
}

echo json_encode($response);
exit;
