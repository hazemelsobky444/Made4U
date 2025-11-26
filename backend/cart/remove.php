    <?php
    // backend/cart/remove.php
    session_start();
    require_once __DIR__ . '/../db.php';
    header('Content-Type: application/json; charset=utf-8');

    if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['error'=>'unauthorized']); exit; }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'method_not_allowed']); exit; }

    $cart_id = intval($_POST['cart_id'] ?? 0);
    if (!$cart_id) { http_response_code(400); echo json_encode(['error'=>'invalid_id']); exit; }

    $stmt = $conn->prepare("DELETE FROM cart WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $cart_id, $_SESSION['user_id']);
    if ($stmt->execute()) {
        echo json_encode(['status'=>'success']);
    } else {
        http_response_code(500); echo json_encode(['error'=>'db_error']);
    }
    $stmt->close();
    ?>
